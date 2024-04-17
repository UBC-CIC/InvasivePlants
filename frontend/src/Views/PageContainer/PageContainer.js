import React, { createContext } from "react";
import Grid from '@material-ui/core/Grid';
import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { updateMenuState } from "../../Actions/menuActions";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import HomeIcon from '@material-ui/icons/Home';
import DashboardIcon from '@material-ui/icons/Dashboard';

/** Import Pages **/
import Navbar from "../../components/Navbar/Navbar";
import Error404 from '../Pages/error404';
import InvasiveSpeciesPage from '../Pages/InvasiveSpeciesPage';
import AlternativeSpeciesPage from '../Pages/AlternativeSpeciesPage';
import RegionsPage from '../Pages/RegionsPage';

import { useAuthentication } from '../../functions/useAuthentication';
// import { PlantNet } from '../Unused/pl@ntNet';
// import DownloadWebscrap from '../Unused/downloadWebscrap';

export const AuthContext = createContext("user");

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    list: {
        width: 250,
    },
    fullList: {
        width: 'auto',
    },
    drawer: {
        width: 240,
        flexShrink: 0,
    },
    drawerContainer: {
        overflow: 'auto',
    },
    drawerPaper: {
        width: 240,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
}));


function PageContainer(props) {
    const { menuEnabled, updateMenuState } = props;
    const classes = useStyles();
    const history = useNavigate();
    const { user, credentials } = useAuthentication();

    /*
    * Handles closing side menu if an event occurs
    * */
    const handleSideMenuClose = () => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        updateMenuState(false);
    }

    {/* Example side menu is provided below */ }
    const list = () => (
        <div
            className={classes.drawerContainer}
            onClick={handleSideMenuClose(false)}
            onKeyDown={handleSideMenuClose(false)}
        >
            <List>
                <ListItem button key={"home"} onClick={() => history.push("/home")}>
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText primary={"Home"} />
                </ListItem>
                <ListItem button key={"controlPanel"} onClick={() => history.push("/controlPanel")}>
                    <ListItemIcon><DashboardIcon /></ListItemIcon>
                    <ListItemText primary={"Control Panel"} />
                </ListItem>
            </List>
            <Divider />
            <List>
                {['Inactive', 'Inactive', 'Inactive'].map((text, index) => (
                    <ListItem button key={text}>
                        <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                        <ListItemText primary={text} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (<Grid container direction="column">
        {/* Navbar component, set side menu button parameter --> button updates redux state to show/hide left sidebar */}
        <Navbar showSideMenuButton={true} />

        <main className={classes.content}>
            <AuthContext.Provider value={{ user, credentials }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/invasiveSpecies" />} />
                    <Route path="/login" element={<Navigate to="/invasiveSpecies" />} />
                    <Route path="/invasiveSpecies" element={<InvasiveSpeciesPage />} />
                    <Route path="/alternativeSpecies" element={<AlternativeSpeciesPage />} />
                    <Route path="/regions" element={<RegionsPage />} />

                    {/* <Route path="/test" element={<PlantNet />} /> */}
                    {/* <Route path="/download" element={<DownloadWebscrap />} /> */}
                    <Route path="*" element={<Error404 />} />
                </Routes>
            </AuthContext.Provider>

        </main>
    </Grid>)
}

const mapStateToProps = (state) => {
    return {
        menuEnabled: state.appState.showSideBar,
    };
};

const mapDispatchToProps = {
    updateMenuState,
};

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);