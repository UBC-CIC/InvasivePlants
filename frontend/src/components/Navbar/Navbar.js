import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useTheme } from '@material-ui/core/styles';
import { useNavigate } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import MoreIcon from '@material-ui/icons/MoreVert';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Auth } from "aws-amplify";
import { connect } from "react-redux";
import { updateLoginState } from "../../Actions/loginActions";
import { updateMenuState } from "../../Actions/menuActions";
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink, useLocation } from 'react-router-dom';

/* List of tabs for the header */
const pages = ['Invasive Species', 'Alternative Species', 'Regions'];

const useStyles = makeStyles((theme) => ({
    bold: {
        fontWeight: 'bold', // Add more styles here if needed
    },
    grow: {
        flexGrow: 1,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    logo: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
        paddingLeft: '15px',
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
    inactiveLink: {
        fontWeight: 'normal',
        color: 'white',
        textDecoration: 'none',
        '&:hover': {
            color: '#bccccf',
        },
    },
    inactiveLinkMobile: {
        fontWeight: 'normal',
        color: 'black',
        textDecoration: 'none',
        '&:hover': {
            color: '#bccccf',
        },
    },
    activeLink: {
        color: 'white',
        textDecoration: 'underline'
    },
}));

function Navbar(props) {
    const { updateLoginState, updateMenuState, loginState, menuEnabled, showSideMenuButton } = props;
    const classes = useStyles();
    const theme = useTheme();
    const navigate = useNavigate();

    const [user, setUser] = useState("");
    const [loadingBackdrop, setLoadingBackdrop] = React.useState(false);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        handleMobileMenuClose();
    };

    const handleLogout = async () => {
        setLoadingBackdrop(true);
        handleMenuClose();
        await new Promise(r => setTimeout(r, 1000));
        await onSignOut();
        setLoadingBackdrop(false);
    }

    const handleMobileMenuOpen = (event) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={menuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleLogout}><span>Logout  </span><ExitToAppIcon color={"secondary"} /></MenuItem>
        </Menu>
    );

    function formatUrl(inputString) {
        let words = inputString.toLowerCase().split(' ');

        if (words.length === 1) {
            return words[0];
        } else {
            return words[0] + words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        }
    }

    const mobileMenuId = 'primary-search-account-menu-mobile';
    const [activeMenu, setActiveMenu] = useState('');
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem disabled>
                <AccountBoxIcon /><Typography variant={"subtitle1"} noWrap>{user}</Typography>
            </MenuItem>
            {/* Page Navigation Menu */}
            {pages.map((page) => (
                /* Creates a URL path and button for each page */
                <NavLink to={"/" + formatUrl(page)} activeStyle={{
                    color: `${theme.palette.secondary.main}`,
                    borderRadius: 5,
                }} className={classes.inactiveLinkMobile} >
                    <MenuItem>
                        <span style={{
                            textTransform: 'capitalize',
                        }}> {page} </span>
                    </MenuItem>
                </NavLink>
            ))
            }
            <MenuItem onClick={handleLogout}><span>Logout  </span><ExitToAppIcon color={"secondary"} /></MenuItem>
        </Menu>
    );

    useEffect(() => {
        async function retrieveUser() {
            try {
                const returnedUser = await Auth.currentAuthenticatedUser();
                setUser(returnedUser.attributes.email);
            } catch (e) {
                console.log(e);
            }
        }
        retrieveUser();
    }, [loginState])


    const handleSideMenu = () => {
        updateMenuState(!menuEnabled);
    }

    async function onSignOut() {
        updateLoginState("signIn");
        navigate('/');
        await Auth.signOut();
    }

    const location = useLocation();
    const currentPath = decodeURIComponent(location.pathname);
    const currentPage = currentPath.substring(1);

    return (
        <Grid item xs={12} className={classes.appBar}>
            <AppBar position="static" style={{ backgroundColor: '#607c3c' }}>
                <Toolbar >
                    <Typography className={`${classes.title} ${classes.bold}`} variant="h6" component={"h1"} noWrap>
                        Invasive Plants Management System
                    </Typography>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {pages.map((page) => (
                            /* Creates a URL path and button for each page */
                            <NavLink
                                to={"/" + formatUrl(page)}
                                className={`${classes.inactiveLink} ${currentPage.toLowerCase() === page.toLowerCase().replace(/\s/g, '') ? classes.activeLink : ''}`}
                            >
                                <Typography className={classes.title} variant="h6" component={"h1"}>
                                    <span
                                        style={{
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {page}
                                    </span>
                                </Typography>
                            </NavLink>
                        ))}
                    </div>
                    <div style={{ flex: 1 }} />
                    <div className={classes.sectionMobile}>

                    </div>
                    <div className={classes.grow} />
                    <div className={classes.sectionDesktop}>

                        <div
                            color="inherit"
                            style={{ display: "flex", alignItems: "flex-end", flexDirection: 'column', justifyContent: "center" }}>
                            <Typography variant={"subtitle2"} >Logged in as </Typography>
                            <Typography variant={"subtitle2"} >{user}</Typography>
                        </div>
                        <IconButton
                            edge="end"
                            aria-label="account of current user"
                            aria-controls={menuId}
                            aria-haspopup="true"
                            onClick={handleLogout}
                            color="inherit"
                        >
                            <LogoutIcon fontSize={"large"} />
                        </IconButton>
                    </div>
                    <div className={classes.sectionMobile}>
                        <IconButton
                            aria-label="show more"
                            aria-controls={mobileMenuId}
                            aria-haspopup="true"
                            onClick={handleMobileMenuOpen}
                            color="inherit"
                        >
                            <MoreIcon />
                        </IconButton>
                        {renderMobileMenu}
                        {/* {renderMenu} */}
                    </div>
                </Toolbar>
            </AppBar >
            <Backdrop className={classes.backdrop} open={loadingBackdrop}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Grid >
    )

}

const mapStateToProps = (state) => {
    return {
        loginState: state.loginState.currentState,
        menuEnabled: state.appState.showSideBar,
    };
};

const mapDispatchToProps = {
    updateLoginState,
    updateMenuState,
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);