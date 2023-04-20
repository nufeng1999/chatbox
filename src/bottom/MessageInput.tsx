import {createMessage, Message, OpenAIRoleEnum, Settings} from "../types";
import SpeechRecognition, {useSpeechRecognition} from "react-speech-recognition";
import React from "react";
import {useTranslation} from "react-i18next";
import {Box, Checkbox, Grid, IconButton, TextField, Typography} from "@mui/material";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import {AutoSpeechControlUnit} from "../Say";
import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";


interface Props {

}

export default function MessageInput(props: {
    isScrolling: boolean
    scrollControl(): void
    settings: Settings
    onSubmit: (newMsg: Message, needGenerating?: boolean) => void
    setMessageInput: (value: string) => void
}) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    const [isTalking, setIsTalking] = React.useState(false)
    const [isCreimgChecked,setIsCreimgChecked]=React.useState(false)

    const {t} = useTranslation()
    // const {setMessageInput} = props
    const [nmessageInput, setNmessageInput] = React.useState("")
    const submit = (needGenerating = true) => {
        const newmsg={role:OpenAIRoleEnum.User,content: nmessageInput,format: 'markdown',createImg:isCreimgChecked}
        if (isTalking) {
            if (transcript.length === 0) {
                return;
            }
            props.setMessageInput(transcript)
            SpeechRecognition.stopListening();
            setIsTalking(false);
            props.onSubmit(createMessage(newmsg.role,newmsg.content,newmsg.format,newmsg.createImg), needGenerating)
            resetTranscript()
            props.setMessageInput('')
            setNmessageInput('')
            return;
        }
        if (nmessageInput.length === 0) {
            return;
        }

        props.setMessageInput(nmessageInput)
        props.onSubmit(createMessage(newmsg.role,newmsg.content,newmsg.format,newmsg.createImg), needGenerating)
        resetTranscript()
        props.setMessageInput('')
        setNmessageInput('')
    }
    // let isTalking=false;
    const talking = () => {
        if (isTalking) {
            props.setMessageInput(transcript)
            SpeechRecognition.stopListening();
            setIsTalking(false);
            return;
        }
        resetTranscript()
        SpeechRecognition.startListening({language: props.settings.language, continuous: true})
        setIsTalking(true)
        return;
    }
    return (
        <>
            <Box style={{
                verticalAlign:"top",
                display:"inline-block",
                fontSize:"0px",
                paddingTop:"0px",
            }}>
                <Checkbox style={{height:"28px",
                    verticalAlign:"top",
                    display:"inline-block",
                    fontSize:"0px",
                    paddingTop:"0px",
                }}
                          checked={isCreimgChecked}
                          onChange={(event) => {
                              setIsCreimgChecked(event.target.checked);
                          }
                          }
                          title={t('Create image') as string}
                />
            </Box>
            <form onSubmit={(e) => {
                e.preventDefault()
                submit()
            }}>
                <Grid container>
                    <Grid id='inputFbackground' item xs={12}>{
                        isTalking ? (
                                <TextField
                                    multiline
                                    id="isTalking"
                                    label="Prompt"
                                    value={transcript}
                                    // onChange={(event) => setMessageInput(event.target.value)}
                                    fullWidth
                                    maxRows={12}
                                    autoFocus
                                    // id='message-input'
                                    onKeyDown={(event) => {
                                        if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                                            event.preventDefault()
                                            submit()
                                            return
                                        }
                                        if (event.keyCode === 13 && event.ctrlKey) {
                                            event.preventDefault()
                                            submit(false)
                                            return
                                        }
                                    }}
                                />) :
                            (
                                <TextField
                                    multiline
                                    label="Prompt"
                                    value={nmessageInput}
                                    onChange={(event) => {
                                        //判断输入框的高
                                        // const myDiv =document.getElementById('inputField')
                                        const height = window.getComputedStyle(
                                            document.getElementById('message-input') as HTMLElement)
                                            .getPropertyValue('height');
                                        //
                                        //如果高变大了则调整其位置 inputbar 的height+字体高
                                        //中间层height减小 字体高
                                        //修改inputFbackground background-color 为主题背景
                                        //
                                        setNmessageInput(event.target.value)
                                    }}
                                    fullWidth
                                    maxRows={12}
                                    autoFocus
                                    id='message-input'
                                    onKeyDown={(event) => {
                                        if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                                            event.preventDefault()
                                            submit()
                                            return
                                        }
                                        if (event.keyCode === 13 && event.ctrlKey) {
                                            event.preventDefault()
                                            submit(false)
                                            return
                                        }
                                    }}
                                />)
                    }
                    </Grid>
                    <Grid container style={{justifyContent: "right"}}>
                        <Grid item xs={6} justifySelf="left">
                            <Typography variant='caption'
                                        style={{opacity: 0.3}}>{t('[Enter] send, [Shift+Enter] line break')}</Typography>
                            <Typography variant='caption'
                                        style={{opacity: 0.3}}>{t('[Ctrl+Enter] send without generating')}</Typography>
                        </Grid>
                        <Grid item xs={6} style={{justifyContent: "right", display: 'flex'}}>
                            <IconButton size='large' color='primary' disabled={!isTalking && listening}
                                        onClick={props.scrollControl}>
                                {
                                    props.isScrolling ? (
                                        <StopCircleOutlinedIcon/>
                                    ) : (
                                        <RestartAltOutlinedIcon/>
                                    )
                                }
                            </IconButton>
                            {
                                props.settings.autoSpeech && (
                                    <AutoSpeechControlUnit speech={props.settings.speech}
                                                           autoSpeech={props.settings.autoSpeech}/>)
                            }
                            <IconButton size='large' color='primary' disabled={!isTalking && listening}
                                        onClick={talking}>
                                {
                                    listening ? (
                                        <MicOffOutlinedIcon/>
                                    ) : (
                                        <MicNoneOutlinedIcon/>
                                    )
                                }
                            </IconButton>
                            <IconButton size='large' color='primary' type='submit'>
                                <SendOutlinedIcon/>
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>

            </form>

        </>
    )
}