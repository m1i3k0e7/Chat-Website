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
import Post from "../component/Post";

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
        zIndex: '2'
    },
    groupField: {
        height: '50px',
    }
  }));

async function searchGroupByName(searchVal) {
    let result = await get(child(ref(db), 'group/')).then((snapshot) => {
        const data = snapshot.val();
        var searchResult = [];
        if(data) {
            for(const [key, val] of Object.entries(data)) {
                const [name, id] = [val['groupName'], val['id']]
                if(searchVal !== '' && name.includes(searchVal)) {
                    searchResult.push([name, id]);
                }     
            }
        }
        return searchResult;
    })
    return result;
}

const SearchPage = () => {
    const navigate = useNavigate();
    const navis = [() => {}, () => { localStorage.setItem("uidContext", uid); navigate('/profile'); }, () => {navigate('/main')}]
    const classes = useStyles();
    const [searchGroups, setSearchGroups] = useState([]);
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
                           onChange={async (e) => {
                                const searchResult = await searchGroupByName(e.target.value);
                                setSearchGroups(searchResult);
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
            <Post style={{zIndex: '1'}}>

            </Post>
        </div>
    );
};

export default SearchPage;