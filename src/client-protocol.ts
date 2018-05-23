export enum ClientEvent { StartGame, AllReady, NotifyPresident, NotifyNotPresident,
                          StartVote,
                          NotifyPresidentCards, NotifyWaitForCards, NotifyWaitForPlay, NotifyChancellorCards
                          }


export enum Card { Liberal, Fascist }

export function cardToString (card: Card) {
    if (card == Card.Liberal) return "Liberal";
    return "Fascist";
}
