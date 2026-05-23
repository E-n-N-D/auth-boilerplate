import {Test} from '@nestjs/testing'
import * as pactum from 'pactum';
import { AppModule } from "@/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { PrismaService } from "@/prisma/prisma.service";
import { LoginDto, SignUpDto } from "@/features/auth/dto";
import { response } from 'express';

describe('App e2e', ()=>{

    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async ()=>{
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();
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
                    .inspect()
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
                    // .inspect()
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
                    // .inspect()
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
                    // .inspect()
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
                    // .inspect()
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
                    .inspect()
            })

            it("should signup", ()=>{

                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody(dto)
                    .expectStatus(201)
                    .inspect()
            })

            it("should throw 403 error for used email", ()=>{

                return pactum
                .spec()
                .post('/auth/signup')
                .withBody(dto)
                .expectStatus(403)
                .inspect()
            })
        })


        //------------------- Login test -------------------------------//
        describe("Login", () =>{

            it("should throw error 400 for empty body", ()=>{
                return pactum
                    .spec()
                    .post('/auth/login')
                    .expectStatus(400)
                    .inspect()
            })

            it("should throw bad request error 400 for no email", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    password: loginDto.password
                })
                .expectStatus(400)
                .inspect()
            })
            
            it("should throw bad request error 400 for no password", ()=>{
                return pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    email: loginDto.email
                })
                .expectStatus(400)
                .inspect()
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
                .inspect()
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
                .inspect()
            })

            it("should login", ()=>{

                return pactum
                .spec()
                .post('/auth/login')
                .withBody(loginDto)
                .expectStatus(200)
                .stores("AccessToken","res.body.accessToken")
                .stores("RefreshToken","res.body.refreshToken")
                .inspect()

            })
        })

        describe('Update Password', ()=>{

            it("should throw unauthorized error 401 if accessToken not provided", ()=>{
                return pactum
                    .spec()
                    .post('/auth/updatePassword')
                    .expectStatus(401)
                    .inspect()
            })

            it("should throw bad request for empty request body", ()=>{
                return pactum
                .spec()
                .post('/auth/updatePassword')
                .withCookies("refreshToken","$S{RefreshToken}")
                .expectStatus(400)
                .inspect()
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
                .inspect()
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
                .inspect()
            })
        })

        describe("Refresh Tokens", ()=>{
            it("should throw unauthorized error 401 on missing refreshToken",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .expectStatus(401)
                .inspect()
            })

            it("should throw unauthorized error 401 on bad refreshToken",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .withCookies("refreshToken","$S{RefreshToken}")
                .expectStatus(401)
                .inspect()
            })

            it("should refresh the tokens",()=>{
                return pactum
                .spec()
                .get('/auth/refresh')
                .withCookies("refreshToken","$S{RefreshTokenNew}")
                .expectStatus(200)
                .inspect()
            })
        })

    })
    describe('User', ()=>{})
    describe('OTP', ()=>{})
})