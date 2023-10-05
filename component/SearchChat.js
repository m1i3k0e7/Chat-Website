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
import SearchChatItem from "./SearchChatItem";

const useStyles = makeStyles((theme) => ({
    groupItemContainer: {
        maxHeight: '65vh',
        overflowY: "auto",
        border: "1px solid rgb(224,224,224)",
        borderRadius: '3px'
    },
    searchField: {
        position: 'fixed',
        width: 'calc(64vw + 5px)',
    },
    groupField: {
        height: '50px',
    }
  }));

function searchMessages(val, setMessageList, chatList) {
    if(val !== '') {
        var searchResult = [];
        for(let i in chatList) {
            if(chatList[i][1] !== 1 && chatList[i][2].includes(val)) {
                searchResult.push(chatList[i]);
            }
        }
        setMessageList(searchResult);
    }
}

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

const SearchChat = ({chatList}) => {
    const classes = useStyles();
    const [messageList, setMessageList] = useState([]);

    return (
        <div style={{flexDirection: 'column'}}>
            <div className={classes.searchField}>
                <TextField label="Search Messages" 
                           variant="outlined"
                           fullWidth
                           style={{backgroundColor: '#ffffff'}}
                           onChange={(e) => {
                                searchMessages(e.target.value, setMessageList, chatList);
                                if(e.target.value == '') {
                                    setMessageList([]);
                                }
                           }}
                />
                <div className={classes.groupField}>
                    <Grid className={classes.groupItemContainer}>
                        {messageList.map(([time, type, content], index) => {
                            return (<SearchChatItem key={index} time={time} type={type} content={content}></SearchChatItem>)
                        })}
                    </Grid>
                </div>
            </div>
        </div>
    );
};

export default SearchChat;