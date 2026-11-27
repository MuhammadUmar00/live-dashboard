import { Alert, Box, Container, Stack, Typography } from '@mui/material';
import { ConnectionBar } from './components/ConnectionBar';
import { EventsList } from './components/EventsList';
import { KpiCards } from './components/KpiCards';
import { LiveChart } from './components/LiveChart';
import { Loading } from './components/Loading';
import { useLiveStream } from './hooks/useLiveStream';
import { useAppSelector } from './store/dashboard';

function ConnectionNotice() {
  const connection = useAppSelector((state) => state.dashboard.connection);

  if (connection === 'connecting') {
    return <Loading />;
  }

  if (connection === 'reconnecting') {
    return (
      <Alert severity="warning">
        Connection interrupted. Retrying automatically.
      </Alert>
    );
  }

  if (connection === 'error') {
    return <Alert severity="error">Unable to connect. Use Retry to try again.</Alert>;
  }

  if (connection === 'paused') {
    return (
      <Alert severity="info">
        Feed paused. Retained data remains available for filtering.
      </Alert>
    );
  }

  return null;
}

export default function App() {
  const controls = useLiveStream();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="primary">
            Operations / Monitoring
          </Typography>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Live monitoring
          </Typography>
          <Typography color="text.secondary">
            System activity and service health · simulated feed
          </Typography>
        </Box>

        <ConnectionBar {...controls} />
        <ConnectionNotice />
        <KpiCards />
        <LiveChart />
        <EventsList />
      </Stack>
    </Container>
  );
}
