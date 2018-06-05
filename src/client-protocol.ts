export enum Role {Liberal, Fascist, Hitler}
export enum Card { Liberal, Fascist }
export enum Team { Liberal, Fascist }

export function cardToString (card: Card) {
    if (card == Card.Liberal) return "Liberal";
    return "Fascist";
}

///////////////////////////////////////////////
// Events sent from the server to the client //
///////////////////////////////////////////////

export enum ClientEvent {
    StartGame, NotifyPresident, NotifyNotPresident,
    StartVote,
    NotifyPresidentCards, NotifyWaitForCards, NotifyWaitForPlay, NotifyChancellorCards,
    InvestigationPower, SelectPresidentPower, PeekPower, KillPower,
    GameEnd,
    Dead
}

interface StartGameEvent {
    event: ClientEvent.StartGame;
    role: Role;
    otherRoles: { name: string, role: Role };
}

interface NotifyPresidentEvent {
    event: ClientEvent.NotifyPresident;
    otherPlayers: string[];
}

interface NotifyNotPresidentEvent {
    event: ClientEvent.NotifyNotPresident;
    president: string;
}

interface StartVoteEvent {
    event: ClientEvent.StartVote;
    president: string;
    chancellor: string;
    brexit: boolean;
}

interface NotifyPresidentCardsEvent {
    event: ClientEvent.NotifyPresidentCards;
    cards: Card[];  
}

interface NotifyWaitForCardsEvent {
    event: ClientEvent.NotifyWaitForCards;
}

interface NotifyWaitForPlayEvent {
    event: ClientEvent.NotifyWaitForPlay;
}

interface NotifyChancellorCardsEvent {
    event: ClientEvent.NotifyChancellorCards;
    cards: Card[];  
}

interface InvestigationPowerEvent {
    event: ClientEvent.InvestigationPower;
    targets: string[];
}

interface SelectPresidentPowerEvent {
    event: ClientEvent.SelectPresidentPower;
    targets: string[];  
}

interface PeekPowerEvent {
    event: ClientEvent.PeekPower;
    cards: Card[];
}

interface KillPowerEvent {
    event: ClientEvent.KillPower;
    targets: string[];    
}

interface GameEndEvent {
    event: ClientEvent.GameEnd;
    winner: Team;
    otherPlayers: string[];
}

interface DeadEvent {
    event: ClientEvent.Dead;
}

export type Payload = StartGameEvent | NotifyPresidentEvent | NotifyNotPresidentEvent |
    StartVoteEvent |
    NotifyPresidentCardsEvent | NotifyWaitForCardsEvent | NotifyWaitForPlayEvent | NotifyChancellorCardsEvent |
    InvestigationPowerEvent | SelectPresidentPowerEvent | PeekPowerEvent | KillPowerEvent |
    GameEndEvent | 
    DeadEvent;


////////////////////////////////////////////////
// Actions sent from the client to the server //
////////////////////////////////////////////////

export enum ClientAction {
    Register, StartGame, Ready,
    SelectChancellor, SelectPresident,
    Vote, Discard, Play,
    Kill, Investigate, InvestigationComplete, PeekComplete,
    GetPlayerList, Reconnect,
    Kudos
}

interface RegisterAction {
    action: ClientAction.Register;
    name: string;
}
interface StartGameAction {
    action: ClientAction.StartGame;
}
interface ReadyAction {
    action: ClientAction.Ready;
}
interface SelectChancellorAction {
    action: ClientAction.SelectChancellor;
    name: string;
}
interface SelectPresidentAction {
    action: ClientAction.SelectPresident;
    name: string;    
}
interface VoteAction {
    action: ClientAction.Vote;
    vote: boolean;
}
interface DiscardAction {
    action: ClientAction.Discard;
    discard: Card;
    remainder: Card[];
}
interface PlayAction {
    action: ClientAction.Play;
    play: Card;
    discard: Card;
}
interface KillAction {
    action: ClientAction.Kill;
    name: string;
}
interface InvestigateAction {
    action: ClientAction.Investigate;
    name: string;    
}
interface InvestigationCompleteAction {
    action: ClientAction.InvestigationComplete;
}
interface PeekCompleteAction {
    action: ClientAction.PeekComplete;
}
interface GetPlayerListAction {
    action: ClientAction.GetPlayerList;
}
interface ReconnectAction {
    action: ClientAction.Reconnect;
    name: string;
}
interface KudosAction {
    action: ClientAction.Kudos;
    names: string[];
}

export type ActionPayload =
    RegisterAction | StartGameAction | ReadyAction |
    SelectChancellorAction | SelectPresidentAction |
    VoteAction | DiscardAction | PlayAction |
    KillAction | InvestigateAction | InvestigationCompleteAction | PeekCompleteAction |
    GetPlayerListAction | ReconnectAction |
    KudosAction;




