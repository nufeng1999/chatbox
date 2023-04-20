import {createMessage, Message, OpenAIRoleEnum, Session} from "../types";
import {Store} from "../store";
import {Box, Grid} from "@mui/material";
import iconLib from "../iconLib";
import React from "react";
import MessageInput from "./MessageInput";

interface Props {
    isScrolling:boolean
    scrollControl:()=>void
    store: Store
    setMessageInput:(arg0:string)=>void
    generate:(session: Session, promptMsgs: Message[], targetMsg: Message)=>Promise<void>
    messageScrollRef: React.MutableRefObject<{msgId: string, smooth?: boolean | undefined} | null>
}
export default function BottomBar(props: Props){

    return(
        <Grid id='inputbar' style={{
            position: 'absolute',
            width: '100%',
            bottom: '0px',
            fontSize:"0px",
            height: '120px'
        }}>

            <Box sx={{padding: '20px 0', width: '99%', height: 'auto'}} style={{
                verticalAlign:"top",
                display:"inline-block",
                fontSize:"0px",
                paddingTop:"0px",
            }}>
                <MessageInput
                    isScrolling={props.isScrolling}
                    scrollControl={props.scrollControl}
                    settings={props.store.settings}
                    setMessageInput={props.setMessageInput}
                    onSubmit={async (newUserMsg: Message, needGenerating = true) => {
                        if (needGenerating) {
                            const promptsMsgs = [...props.store.currentSession.messages, newUserMsg]
                            const newAssistantMsg = createMessage(
                                OpenAIRoleEnum.Assistant,
                                `<div style='width:100%;float:left;display:block'>&#x2003;${iconLib.waiting}</div>`,
                                'html');
                            props.store.currentSession.messages = [...props.store.currentSession.messages, newUserMsg, newAssistantMsg]
                            props.store.updateChatSession(props.store.currentSession)
                            // console.log("newAssistantMsg  " + newAssistantMsg.content)
                            props.generate(props.store.currentSession, promptsMsgs, newAssistantMsg)
                            // if (store.settings.autoSpeech) handleSay(newAssistantMsg,store.settings.speech);
                            props.messageScrollRef.current = {msgId: newAssistantMsg.id, smooth: true}
                        } else {
                            props.store.currentSession.messages = [...props.store.currentSession.messages, newUserMsg]
                            props.store.updateChatSession(props.store.currentSession)
                            props.messageScrollRef.current = {msgId: newUserMsg.id, smooth: true}
                        }
                    }}
                />
            </Box>
        </Grid>
    )
}