import React, { useState } from 'react';
import { Button, TextField, Grid, Paper, Typography, Container, Box, alpha } from '@mui/material';
import adminCredentials from '../components/adminCredentials.json';

// Login page
const LoginPage = ({ handleLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    // Authenticates user -- edit adminCredentials.json file to add an admin to the system
    const handleLoginSubmit = (event) => {
        event.preventDefault();
        const foundUser = adminCredentials.find((user) => user.username === username && user.password === password);
        if (foundUser) {
            handleLogin();
        } else {
            alert('Invalid username or password');
        }
    };

    return (
        <Container fixed >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
                <Typography variant="h4">
                    Invasive Species Management System
                </Typography>
            </Box>
            <Container maxWidth="xs">
                <Paper elevation={3} style={{ padding: 20, marginTop: 50 }}>
                    <Typography variant="h5" align="center" gutterBottom >
                        Admin Login
                    </Typography>
                    <form onSubmit={handleLoginSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Username"
                                    variant="outlined"
                                    fullWidth
                                    value={username}
                                    onChange={handleUsernameChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    type="password"
                                    label="Password"
                                    variant="outlined"
                                    fullWidth
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="primary" fullWidth
                                    sx={{
                                        backgroundColor: alpha('#699cb8', 0.9),
                                        '&:hover': {
                                            backgroundColor: '#5e8da6',
                                        }
                                    }}>
                                    Log in
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Container>
        </Container>
    );
};

export default LoginPage;