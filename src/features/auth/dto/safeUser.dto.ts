export class SafeUser {
    id!: string;
    email!: string;
    firstName!: string;
    lastName!: string;
    isVerified!: boolean;
    createdAt!: Date;
    updatedAt!: Date;

    static from(user: Record<string, any>): SafeUser {
        const safe = new SafeUser();
        safe.id = user.id;
        safe.email = user.email;
        safe.firstName = user.firstName;
        safe.lastName = user.lastName;
        safe.isVerified = user.isVerified;
        safe.createdAt = user.createdAt;
        safe.updatedAt = user.updatedAt;
        return safe;
    }

}