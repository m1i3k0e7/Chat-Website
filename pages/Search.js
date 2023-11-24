import { withStyles, makeStyles, Button, TextField, Grid, Paper } from "@material-ui/core";
import { grey } from '@material-ui/core/colors';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../component/Header"
import SearchIcon from '@material-ui/icons/Search';
import "../style.css";
import { set, ref, get, onValue, child } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import SearchItem from "../component/SearchItem";

const useStyles = makeStyles((theme) => ({
    title: {
      flexGrow: 1,
      [theme.breakpoints.down('md')]: {
        fontSize: '22px',
        },
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
        },
    },
    groupItemContainer: {
        maxHeight: '65vh',
        overflowY: "auto",
        border: "1px solid rgb(224,224,224)",
        borderRadius: '3px'
    },
    searchField: {
        position: 'fixed',
        width: '40vw',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    },
    groupField: {
        height: '50px',
    }
  }));

const ColorButton = withStyles((theme) => ({
    root: {
        color: theme.palette.getContrastText(grey[900]),
        backgroundColor: grey[900],
        '&:hover': {
            backgroundColor: grey[700],
        },
    },
}))(Button);

async function searchGroupByName(searchVal, setSearchGroups, setSearchError) {
    if(searchVal !== '') {
        await get(child(ref(db), 'group/')).then((snapshot) => {
            const data = snapshot.val();
            var searchResult = [];
            if(data) {
                for(const [key, val] of Object.entries(data)) {
                    const [name, id] = [val['groupName'], val['id']]
                    if(searchVal !== '' && name.includes(searchVal)) {
                        searchResult.push([name, id]);
                    }     
                }
                setSearchGroups(searchResult);
            } else {
                setSearchGroups([]);
            }
        }).catch(error => {
            console.log(error.message);
            setSearchError(true);
        });
    }
}

const SearchPage = () => {
    const navigate = useNavigate();
    const navis = [() => {}, () => { localStorage.setItem("uidContext", uid); navigate('/profile'); }, () => {navigate('/main')}]
    const classes = useStyles();
    const [searchGroups, setSearchGroups] = useState([]);
    const [searchError, setSearchError] = useState(false);
    const [username, setUsername] = useState('');
    const [uid, setUid] = useState('');

    useEffect(()=>{
        onAuthStateChanged(getAuth(app), (user) => {
            if(!user) {
                navigate('/');
            } else {
                setUid(user.uid);
                get(child(ref(db), 'user/' + user.uid)).then(async (snapshot) => {
                    setUsername(snapshot.val()['username']);
                })
            }
        });
    }, []);
    
    return (
        <div style={{flexDirection: 'column'}}>
            <Header isLogin={true} classes={classes} title={"Chat Room"} selected={"Explore"} navis={navis} login={true}></Header>
            <div className={classes.searchField}>
                <TextField label="Search Group" 
                           variant="outlined" 
                           style={{width: "calc(100%)", backgroundColor: 'white'}}
                           onChange={(e) => {
                                searchGroupByName(e.target.value, setSearchGroups, setSearchError);
                                if(e.target.value === '')
                                    setSearchGroups([]);
                           }}
                />
                
                <div className={classes.groupField}>
                    <Grid className={classes.groupItemContainer}>
                        {searchGroups.map(([groupName, groupId], index) => {
                            return (<SearchItem key={index} groupName={groupName} groupId={groupId} username={username}></SearchItem>)
                        })}
                    </Grid>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;