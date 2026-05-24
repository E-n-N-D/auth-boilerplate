export class MockMailService {
    private lastOtp: string|null = null

    async sendEmailVerificationOtp(_email: string, otp: string){
        this.lastOtp = otp;
    }

    async sendPasswordResetOtp(_email: string, otp: string){
        this.lastOtp = otp;
    }

    async sendTwoFactorOtp(_email: string, otp: string) {
        this.lastOtp = otp;
    }

    captureOtp(): string{
        const otp = this.lastOtp;
        this.lastOtp = null;
        return otp as string;
    }

}