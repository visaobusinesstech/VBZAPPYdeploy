import React from "react";
import { AppBar, Toolbar, Tabs, Tab, makeStyles, IconButton } from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import MenuIcon from "@material-ui/icons/Menu";

const useStyles = makeStyles((theme) => ({
  secondaryNavbar: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.08)",
    top: "48px", // Altura da AppBar principal
    zIndex: theme.zIndex.drawer,
  },
  tabs: {
    "& .MuiTabs-indicator": {
      backgroundColor: theme.palette.primary.main,
    },
  },
  tab: {
    fontWeight: "bold",
    textTransform: "none",
    borderRadius: "0", // Quadrado
    backgroundColor: "transparent", // Transparente
    border: "1px solid transparent", // Borda transparente
    minWidth: "120px", // Largura mínima
    margin: "0 2px", // Pequeno espaçamento
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)", // Leve destaque no hover
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(19, 27, 45, 0.1)", // Cor do tema (#131B2D) com opacidade
      borderColor: "#131B2D", // Cor do tema
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    color: theme.palette.text.primary,
  },
}));

const SecondaryNavbar = ({ onMenuClick, drawerOpen }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    if (path === "") return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const pageTitle = getPageTitle();

  const handleTabChange = (event, newValue) => {
    history.push(newValue);
  };

  return (
    <AppBar position="sticky" className={classes.secondaryNavbar}>
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          aria-label="toggle drawer"
          onClick={onMenuClick}
          className={classes.menuButton}
        >
          <MenuIcon />
        </IconButton>
        <Tabs
          value={location.pathname}
          onChange={handleTabChange}
          className={classes.tabs}
        >
          <Tab label={pageTitle} value={location.pathname} className={classes.tab} />
          <Tab label="Dashboard" value="/dashboard" className={classes.tab} />
          <Tab label="Lista" value="/tickets" className={classes.tab} />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default SecondaryNavbar;
