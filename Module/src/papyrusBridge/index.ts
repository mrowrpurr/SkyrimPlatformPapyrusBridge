import { on, once, Game, Form, writeLogs, printConsole, Debug } from 'skyrimPlatform'
import * as sp from 'skyrimPlatform'

const skyrimPlatformBridgeEsp = 'SkyrimPlatformBridge.esp'
const skyrimPlatformBridgeMessagesContainerId = 0xd66
const skyrimPlatformBridgeQuestId = 0x800
const skyrimPlatformBridgeDefaultMessageSkseModEventName = 'SkyrimPlatformBridge_Generic'

export interface PapyrusMessage {
    text: string
}

function log(...args: any[]) {
    writeLogs('papyrusBridge', Date.now(), args)
}

export class PapyrusBridge {
    modName = ''
    messagesContainerFormId = 0
    questFormId = 0
    // questForm: Form | null = null // TODO
    isListening = false
    messageHandlers = new Array<(message: PapyrusMessage) => void>()

    constructor(modName: string = '') {
        this.modName = modName
    }

    public onMessage(handler: (message: PapyrusMessage) => void) {
        this.listenForMessages()
        this.messageHandlers.push(handler)
    }

    public sendMessage(text: string) {
        once('update', () => {
            let quest: Form | null = null
            if (!this.questFormId) {
                quest = Game.getFormFromFile(skyrimPlatformBridgeQuestId, skyrimPlatformBridgeEsp)
                if (quest) {
                    this.questFormId = quest.getFormID()
                }
            }
            if (!quest) {
                // Todo: cache object (and handle stale errors)
                quest = Game.getFormFromFile(skyrimPlatformBridgeQuestId, skyrimPlatformBridgeEsp)
            }
            if (quest) {
                const handle: any = (sp as any).ModEvent.create(skyrimPlatformBridgeDefaultMessageSkseModEventName)
                printConsole(`the handle is: ${handle}`)
                if (handle) {
                    printConsole("SENDING...");
                    (sp as any).ModEvent.pushString(handle, "Hello, world!");
                    (sp as any).ModEvent.send(handle)
                    printConsole("SENT")
                }
            } else {
                log(`Could not send message, Quest object ${skyrimPlatformBridgeQuestId.toString(16)} not found. Message: ${text}`)
            }
        })
    }

    public mod(modName: string): PapyrusBridge {
        return new PapyrusBridge(modName)
    }

    listenForMessages() {
        if (!this.isListening) {
            on('containerChanged', changeInfo => {
                if (changeInfo.newContainer) {
                    if (!this.messagesContainerFormId) {
                        const container = Game.getFormFromFile(skyrimPlatformBridgeMessagesContainerId, skyrimPlatformBridgeEsp)
                        if (container) {
                            this.messagesContainerFormId = container.getFormID()
                        }
                    }
                    if (this.messagesContainerFormId && this.messagesContainerFormId == changeInfo.newContainer.getFormID()) {
                        const message: PapyrusMessage = { text: changeInfo.baseObj.getName() }
                        this.messageHandlers.forEach(handler => handler(message))
                    }
                }
            })
        }
    }
}

const defaultInstance = new PapyrusBridge()

export default defaultInstance