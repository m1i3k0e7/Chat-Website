import { withStyles, makeStyles, Box, Toolbar, AppBar, Button, Divider, TextField, Typography } from "@material-ui/core";
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import SearchIcon from '@material-ui/icons/Search';
import ChatIcon from '@material-ui/icons/Chat';

const Header = ({navItems, classes, title, selected, navis, login}) => {
    const icons = [<SearchIcon fontSize="small" style={{paddingRight: '10px'}}/>, 
                   <AccountCircleIcon fontSize="small" style={{paddingRight: '10px'}}/>, 
                   <ChatIcon fontSize="small" style={{paddingRight: '10px'}}/>]
    return (
        <AppBar component="nav" color="white">
            <Toolbar>
                <Typography
                    variant="h5"
                    component="div"
                    className={classes.title}
                    sx={{ flexGrow: 1, display: 'block' }}
                >
                    {title}
                </Typography>
                <Box sx={{ display: 'block' }}>
                    {navItems.map((item, index) => (
                    <Button key={item} onClick={navis[index]} style={item == selected ? { 
                        color: '#fff',
                        backgroundColor: '#000',
                        minWidth: "120px"
                    } : {minWidth: "120px"}}>
                        {login ? icons[index] : <div></div>}{item}
                    </Button>
                    ))}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;