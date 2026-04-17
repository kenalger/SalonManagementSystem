import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, TextField,
  Button, Alert, CircularProgress,
} from '@mui/material';
import { ContentCut, AddBusiness, GroupAdd, ArrowForward } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setOrganization } = useAuth();
  const [tab, setTab] = useState(0);

  const [createForm, setCreateForm] = useState({
    name: '', description: '', location: '', email: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateChange = (e) =>
    setCreateForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const { data } = await api.post('/api/organizations', createForm);
      setOrganization(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinError('');
    setJoinLoading(true);
    try {
      const { data } = await api.post('/api/organizations/join', { inviteCode: inviteCode.trim() });
      setOrganization(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid invite code. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 3, boxShadow: 8 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ContentCut sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              Welcome, {user?.fullName?.split(' ')[0]}!
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Set up your workspace to get started
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AddBusiness />} label="Create" iconPosition="start" />
            <Tab icon={<GroupAdd />} label="Join Existing" iconPosition="start" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>
            )}
            <Box component="form" onSubmit={handleCreate}>
              <TextField
                fullWidth label="Organization Name" name="name"
                value={createForm.name} onChange={handleCreateChange}
                required margin="dense"
              />
              <TextField
                fullWidth label="Description" name="description"
                value={createForm.description} onChange={handleCreateChange}
                margin="dense" multiline rows={2}
              />
              <TextField
                fullWidth label="Location" name="location"
                value={createForm.location} onChange={handleCreateChange}
                margin="dense"
              />
              <TextField
                fullWidth label="Business Email" name="email" type="email"
                value={createForm.email} onChange={handleCreateChange}
                margin="dense"
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={createLoading}
                endIcon={!createLoading && <ArrowForward />}
                sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
              >
                {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Organization'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {joinError && (
              <Alert severity="error" sx={{ mb: 2 }}>{joinError}</Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the invite code shared by your organization admin.
            </Typography>
            <Box component="form" onSubmit={handleJoin}>
              <TextField
                fullWidth
                label="Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 8, style: { letterSpacing: '0.3em', fontFamily: 'monospace', fontSize: '1.2rem' } }}
                placeholder="XXXXXXXX"
                required
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={joinLoading || inviteCode.trim().length === 0}
                endIcon={!joinLoading && <ArrowForward />}
                sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
              >
                {joinLoading ? <CircularProgress size={24} color="inherit" /> : 'Join Organization'}
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
