export enum ClientEvent { StartGame, AllReady, NotifyPresident, NotifyNotPresident,
                          StartVote,
                          NotifyCards, NotifyWaitForCards, NotifyWaitForPlay}


export enum Card { Liberal, Fascist }

export function cardToString (card: Card) {
    if (card == Card.Liberal) return "Liberal";
    return "Fascist";
}
