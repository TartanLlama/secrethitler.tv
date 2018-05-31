export enum Role {Liberal, Fascist, Hitler}

export enum ClientEvent { StartGame, NotifyPresident, NotifyNotPresident,
                          StartVote,
                          NotifyPresidentCards, NotifyWaitForCards, NotifyWaitForPlay, NotifyChancellorCards,
                          InvestigationPower, SelectPresidentPower, PeekPower, KillPower,
                          LiberalVictory, FascistVictory,
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

interface LiberalVictoryEvent {
    event: ClientEvent.LiberalVictory;
}

interface FascistVictoryEvent {
    event: ClientEvent.FascistVictory;
}

interface DeadEvent {
    event: ClientEvent.Dead;
}

export type Payload = StartGameEvent | NotifyPresidentEvent | NotifyNotPresidentEvent |
    StartVoteEvent |
    NotifyPresidentCardsEvent | NotifyWaitForCardsEvent | NotifyWaitForPlayEvent | NotifyChancellorCardsEvent |
    InvestigationPowerEvent | SelectPresidentPowerEvent | PeekPowerEvent | KillPowerEvent |
    LiberalVictoryEvent | FascistVictoryEvent |
    DeadEvent;

export enum Card { Liberal, Fascist }

export function cardToString (card: Card) {
    if (card == Card.Liberal) return "Liberal";
    return "Fascist";
}
