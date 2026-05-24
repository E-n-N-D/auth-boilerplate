import {Test} from '@nestjs/testing'
import * as pactum from 'pactum';
import { AppModule } from "@/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { PrismaService } from "@/prisma/prisma.service";
import { LoginDto, SignUpDto } from "@/features/auth/dto";
import { MailService } from '@/features/mail/mail.service';
import { MockMailService } from './mock-mail.service';
import { match } from 'assert';

describe('App e2e', ()=>{

    let app: INestApplication;
    let prisma: PrismaService;
    let mockMailService: MockMailService;

    beforeAll(async ()=>{

        mockMailService = new MockMailService();

        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        })
        .overrideProvider(MailService)
        .useValue(mockMailService)    
        .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true // trims the values not defined in the dtos 
        }));
        app.enableCors({
            credentials: true
        })
        app.use(cookieParser());
        app.setGlobalPrefix('api');

        await app.init();
        await app.listen(3000);

        prisma = app.get(PrismaService);

        await prisma.cleanDb();

        pactum.request.setBaseUrl('http://localhost:3000/api')
    });

    afterAll(()=>{
        app.close()
    })

    describe('Auth', ()=>{
        const dto: SignUpDto = {
            email: 'sushant.adhikari@gmail.com',
            password: 'Helloworld@123',
            firstName: "Sushant",
            lastName: "Adhikari",
        }

        const loginDto: LoginDto = {
            email: dto.email,
            password: dto.password
        }

        //-------------------- Signup test -------------------------------//
        describe('Signup', ()=>{

            it("should throw error 400 for empty body", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .expectStatus(400)
                    
            })

            it("should throw bad request error 400 for bad email", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        email: "a.com",
                        password: dto.password,
                        firstName: dto.firstName,
                        lastName: dto.lastName
                    })
                    .expectStatus(400)
                    // 
            })

            it("should throw bad request error 400 for no email", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        password: dto.password,
                        firstName: dto.firstName,
                        lastName: dto.lastName
                    })
                    .expectStatus(400)
                    // 
            })

            it("should throw bad request error 400 for no password", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        email: dto.email,
                        firstName: dto.firstName,
                        lastName: dto.lastName
                    })
                    .expectStatus(400)
                    // 
            })

            it("should throw bad request error 400 for no firstName", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        email: dto.email,
                        password: dto.password,
                        lastName: dto.lastName
                    })
                    .expectStatus(400)
                    // 
            })

            it("should throw bad request error 400 for no lastName", ()=>{
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        email: dto.email,
                        password: dto.password,
                        firstName: dto.firstName,
                    })
                    .expectStatus(400)
                    
            })

            it("should signup", ()=>{

                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody(dto)
                    .expectStatus(201)
                    
            })

            it("should throw 403 error for used email", ()=>{

                return pactum
                .spec()
                .post('/auth/signup')
                .withBody(dto)
                .expectStatus(403)
                
            })
        })

        //------------------- Login test -------------------------------//
        describe("Login", () =>{

            it("should throw error 400 for empty body", ()=>{
                return pactum
                    .spec()
                    .post('/auth/login')
                    .expectStatus(400)
                    
            })

            it("should throw bad request error 400 for no email", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    password: loginDto.password
                })
                .expectStatus(400)
                
            })
            
            it("should throw bad request error 400 for no password", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    email: loginDto.email
                })
                .expectStatus(400)
                
            })
            
            it("should throw bad request error 400 for incorrect email", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    email: "a@gmail.com",
                    password: loginDto.password
                })
                .expectStatus(400)
                
            })

            it("should throw bad request error 400 for incorrect password", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    email: loginDto.email,
                    password: "aaaa"
                })
                .expectStatus(400)
                
            })

            it("should login", ()=>{

                return pactum
                .spec()
                .post('/auth/login')
                .withBody(loginDto)
                .expectStatus(200)
                .stores("AccessToken","res.body.accessToken")
                .stores("RefreshToken","res.body.refreshToken")
                

            })
        })

        //------------------- Update Password test -------------------------------//
        describe('Update Password', ()=>{

            it("should throw unauthorized error 401 if accessToken not provided", ()=>{
                return pactum
                    .spec()
                    .post('/auth/updatePassword')
                    .expectStatus(401)
                    
            })

            it("should throw bad request for empty request body", ()=>{
                return pactum
                .spec()
                .post('/auth/updatePassword')
                .withCookies("refreshToken","$S{RefreshToken}")
                .expectStatus(400)
                
            })

            it("should throw bad request for less character Password", ()=>{
                return pactum
                .spec()
                .post('/auth/updatePassword')
                .withCookies("refreshToken","$S{RefreshToken}")
                .withBody({
                    password: "aaaas"
                })
                .expectStatus(400)
                
            })

            it("should update password", async()=>{
                // waiting some seconds for refreshTokens to be different
                await new Promise(resolve => setTimeout(resolve, 1000));
                return pactum
                .spec()
                .post('/auth/updatePassword')
                .withCookies("refreshToken","$S{RefreshToken}")
                .withBody({
                    password: loginDto.password
                })
                .stores("AccessTokenNew","res.body.accessToken")
                .stores("RefreshTokenNew","res.body.refreshToken")
                .expectStatus(200)
                
            })
        })

        //------------------- Refresh Tokens test -------------------------------//
        describe("Refresh Tokens", ()=>{
            it("should throw unauthorized error 401 on missing refreshToken",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .expectStatus(401)
                
            })

            it("should throw unauthorized error 401 on bad refreshToken",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .withCookies("refreshToken","$S{RefreshToken}")
                .expectStatus(401)
                
            })

            it("should refresh the tokens",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .withCookies("refreshToken","$S{RefreshTokenNew}")
                .expectStatus(200)
                
            })
        })

        // ─── Email Verification ──────────────────────────────────────────────────
        describe('Email Verification', () => {
            let otp: string;

            it('should throw 401 if no access token', () => {
                return pactum
                    .spec()
                    .get('/auth/emailVerification')
                    .expectStatus(401);
            });

            // ONE request — OTP captured and reused across the next two tests
            it('should send email verification OTP', async () => {
                await pactum
                    .spec()
                    .get('/auth/emailVerification')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .expectStatus(200)
                    .expectBodyContains('Email Verification code sent!');

                otp = mockMailService.captureOtp();
                expect(otp).toMatch(/^\d{6}$/);
            });

            // Uses the active OTP session but submits a wrong value — OTP stays active
            it('should throw 400 for wrong OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyEmail')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ otp: '000000' })
                    .expectStatus(400);
            });

            // Same OTP from two tests ago — still valid because wrong attempt doesn't consume it
            it('should verify email with correct OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyEmail')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ otp })
                    .expectStatus(200)
                    .expectBodyContains('Email verified successfully!');
            });

            // OTP is now consumed — any further call short-circuits on isVerified check
            it('should return already verified if called again', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyEmail')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ otp: '123456' })
                    .expectStatus(200)
                    .expectBodyContains('Email already verified!');
            });
        });

        // ─── Password Reset OTP ───────────────────────────────────────────────────
        describe('Password Reset OTP', () => {
            let otp: string;

            it('should throw 401 if no access token', () => {
                return pactum
                    .spec()
                    .get('/auth/resetPassword')
                    .expectStatus(401);
            });

            it('should send password reset OTP', async () => {
                await pactum
                    .spec()
                    .get('/auth/resetPassword')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .expectStatus(200)
                    .expectBodyContains('Password reset verification code sent!');

                otp = mockMailService.captureOtp();
                expect(otp).toMatch(/^\d{6}$/);
            });

            // Submit wrong value — OTP still active afterwards
            it('should throw 400 for wrong OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: '000000', purpose: 'password-reset' })
                    .expectStatus(400);
            });

            // Correct OTP — consumed after this
            it('should verify password reset OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: otp, purpose: 'password-reset' })
                    .expectStatus(200)
                    .expectBodyContains('Otp Verification successful');
            });

            // OTP is now marked used — reusing it should fail
            // Cooldown is 0 in test env so re-requesting is fine
            it('should throw 400 on OTP reuse', async () => {
                await pactum
                    .spec()
                    .get('/auth/resetPassword')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}');

                const freshOtp = mockMailService.captureOtp();

                // First use
                await pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: freshOtp, purpose: 'password-reset' })
                    .expectStatus(200);

                // Reuse — no active OTP exists anymore
                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: freshOtp, purpose: 'password-reset' })
                    .expectStatus(400);
            });
        });

        // ─── Two Factor OTP ───────────────────────────────────────────────────────
        describe('Two Factor OTP', () => {
            let otp: string;

            it('should throw 401 if no access token', () => {
                return pactum
                    .spec()
                    .get('/auth/twoFactor')
                    .expectStatus(401);
            });

            it('should send two factor OTP', async () => {
                await pactum
                    .spec()
                    .get('/auth/twoFactor')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .expectStatus(200)
                    .expectBodyContains('Two Factor verification code sent!');

                otp = mockMailService.captureOtp();
                expect(otp).toMatch(/^\d{6}$/);
            });

            // Wrong value — OTP still active
            it('should throw 400 for wrong two factor OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: '000000', purpose: 'two-factor' })
                    .expectStatus(400);
            });

            // Same OTP — still valid
            it('should verify two factor OTP', () => {
                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: otp, purpose: 'two-factor' })
                    .expectStatus(200)
                    .expectBodyContains('Otp Verification successful');
            });

            it('should throw 400 on OTP reuse', async () => {
                await pactum
                    .spec()
                    .get('/auth/twoFactor')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}');

                const freshOtp = mockMailService.captureOtp();

                await pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: freshOtp, purpose: 'two-factor' })
                    .expectStatus(200);

                return pactum
                    .spec()
                    .post('/auth/verifyOTP')
                    .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                    .withBody({ submitted: freshOtp, purpose: 'two-factor' })
                    .expectStatus(400);
            });
        });

    })
    describe('User', ()=>{
        describe("Get User", ()=>{
            it("should return unauthorized on missing accessToken",()=>{
                return pactum
                        .spec()
                        .get("/user/me")
                        .expectStatus(401)
            })

            it("should return user", ()=>{
                return pactum
                        .spec()
                        .get("/user/me")
                        .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                        .expectJsonLike({
                            user:{
                                id: "typeof $V === 'string'"
                            }
                        })
            })

        })

        describe("Update User", ()=>{
            it("should return unauthorized on missing accessToken",()=>{
                return pactum
                        .spec()
                        .put("/user/update")
                        .expectStatus(401)
            })

            it("should return bad request error on missing body",()=>{
                return pactum
                        .spec()
                        .put("/user/update")
                        .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                        .expectStatus(400)
            })

            it("should update user", ()=>{
                return pactum
                        .spec()
                        .put("/user/update")
                        .withHeaders('Authorization', 'Bearer $S{AccessToken}')
                        .withBody({
                            firstName: "Samir"
                        })
                        .expectStatus(200)
            })
        })
    })
})