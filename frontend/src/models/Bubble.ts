import type { User } from "./User";

export class Bubble {
    bubbleId: string;
    name: string;
    ownerId: string;
    isPrivate: boolean;
    details: string | null;
    members: User[];

    constructor(
        bubbleId: string,
        name: string,
        ownerId: string,
        isPrivate: boolean,
        details: string | null = null,
        members: User[] = []
    ) {
        this.bubbleId = bubbleId;
        this.name = name;
        this.ownerId = ownerId;
        this.isPrivate = isPrivate;
        this.details = details;
        this.members = members;
    }

    addMember(user: User): void {
        const alreadyMember = this.members.some(
            (member) => member.userId === user.userId
        );

        if (!alreadyMember) {
            this.members.push(user);
        }
    }

    removeMember(userId: string): void {
        this.members = this.members.filter(
            (member) => member.userId !== userId
        );    
    }

    customize(name: string, isPrivate: boolean, details: string) {
        this.name = name;
        this.isPrivate = isPrivate;
        this.details = details;
    }
}