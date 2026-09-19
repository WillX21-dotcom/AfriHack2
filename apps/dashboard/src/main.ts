// The Royal Desk is mounted by the root app (src/App.tsx), which restores the session, loads the
// user's data and starts realtime before rendering. This standalone entry point used to render the
// dashboard without any of that, so it simply forwards to the root app.
window.location.replace('/');
