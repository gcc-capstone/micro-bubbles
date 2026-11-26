import type { User } from "./User";

// for customize method
type BubbleUpdates = {
    name: string;
    isPrivate: boolean;
    details: string | null;
};

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

    customize(updates: Partial<BubbleUpdates>): void {
        if (updates.name !== undefined) {
            this.name = updates.name;
        }
        if (updates.isPrivate !== undefined) {
            this.isPrivate = updates.isPrivate;
        }
        if (updates.details !== undefined) {
            this.details = updates.details;
        }
    }
}