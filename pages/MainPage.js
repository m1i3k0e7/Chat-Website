import { withStyles, makeStyles, Button, Grid } from "@material-ui/core";
import { grey } from '@material-ui/core/colors';
import { useState, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../component/Header"
import Groups from "../component/Groups";
import Chat from "../component/Chats";
import "../style.css";
import { ref, get, child } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

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
        overflowY: "scroll",
    }
  }));

function notifyUser(message = 'New Message from Chat Room') {
    if(!("Notification" in window)) {
        console.log("Browser does not support notifications");
    } else if(Notification.permission === 'granted') {
        const notifications = new Notification(message);
    }
}

const MainPage = () => {
    const [username, setUsername] = useState("");
    const [groupsList, setGroupsList] = useState([]);
    const [groupInfo, setGroupInfo] = useState([]);
    const [uid, setUid] = useState("");
    const navigate = useNavigate();
    const navis = [() => { navigate('/search'); }, () => { localStorage.setItem("uidContext", uid); navigate('/profile'); }, () => {}]
    const classes = useStyles();
    useEffect(()=>{
        onAuthStateChanged(getAuth(app), (user) => {
            if (user) {
                setUid(user.uid);
                get(child(ref(db), 'user/' + user.uid)).then(async (snapshot) => {
                    const data = snapshot.val()['username'];
                    if(data) {
                        setUsername(data);
                    } else {
                        setUsername('');
                    }
                })

                get(child(ref(db), 'join/' + user.uid)).then(async (data) => {
                    var listData = data.val();
                    if(listData) {
                        for(let i = 0; i < listData.length; i += 1) {
                            const readList = await get(child(ref(db), 'group/' + listData[i][1])).then(async (snapshot) => {
                                return snapshot.val()['read'];
                            })
                            if(readList) {
                                listData[i].push(!readList.includes(user.uid));
                            } else {
                                listData[i].push(false);
                            }
                        }
                        setGroupsList([...listData]);
                        setGroupInfo([listData[0][0], listData[0][1]])
                    }
                });
            } else {
                navigate('/');
            }
        });
    }, []);

    return (
        <div style={{flexDirection: 'column'}}>
            <Header isLogin={true} classes={classes} title={"Chat Room"} selected={"Chat"} navis={navis} login={true}></Header>
            <Grid container direction="row" style={{paddingTop: 60, height:"calc(100vh - 74px)"}}>
                <Grid item style={{width:"35%"}}>
                    <Groups groupInfo={groupInfo} 
                            groupsList={groupsList} 
                            username={username} 
                            setGroupsList={setGroupsList} 
                            setGroupInfo={setGroupInfo}
                    ></Groups>
                </Grid>
                <Grid item style={{backgroundColor:"white", width:"65%"}}>
                    {groupInfo ? <Chat groupInfo={groupInfo} 
                                              setGroupsList={setGroupsList}
                                              groupsList={groupsList}
                                        ></Chat> : <div></div>}
                </Grid>
            </Grid>
        </div>
    );
};

export default MainPage;