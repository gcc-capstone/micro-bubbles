import type { Bubble } from "./Bubble";

export class User {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    bio: string | null;
    instaLink: string | null;
    stravaLink: string | null;
    snapLink: string | null;
    hobbies: string[];
    location: string | null;
    friends: User[];

    constructor(
        userId: string,
        firstName: string,
        lastName: string,
        username: string,
        email: string,
        phone: string,
        bio: string | null = null,
        instaLink: string | null = null,
        stravaLink: string | null = null,
        snapLink: string | null = null,
        hobbies: string[] = [],
        location: string | null = null,
        friends: User[] = []
    ) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.bio = bio;
        this.instaLink = instaLink;
        this.stravaLink = stravaLink;
        this.snapLink = snapLink;
        this.hobbies = hobbies;
        this.location = location;
        this.friends = friends;
    }

    get name(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    join(bubble: Bubble): void {
        bubble.addMember(this);
    }

    leave(bubble: Bubble): void {
        bubble.removeMember(this.userId);
    }

    addFriend(user: User): void {
        const alreadyFriend = this.friends.some(
            (friend) => friend.userId === user.userId
        );

        if (!alreadyFriend) {
            this.friends.push(user);
        }
    }

    removeFriend(userId: string): void {
        this.friends = this.friends.filter(
            (friend) => friend.userId !== userId
        );    
    }
}


