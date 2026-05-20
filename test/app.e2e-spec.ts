import {Test} from '@nestjs/testing'
import * as pactum from 'pactum';
import { AppModule } from "@/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { PrismaService } from "@/prisma/prisma.service";
import { SignUpDto } from "@/features/auth/dto";

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
    });

    afterAll(()=>{
        app.close()
    })

    describe('Auth', ()=>{
        describe('Signup', ()=>{
            it("should signup", ()=>{
                const dto: SignUpDto = {
                email: 'sushant.adhikari@gmail.com',
                password: 'Helloworld@123',
                firstName: "Sushant",
                lastName: "Adhikari",
            }

            return pactum
                .spec()
                .post('http://localhost:3000/api/auth/signup')
                .withBody(dto)
                .expectStatus(201)
                .inspect()
            })
        })
    })
    describe('User', ()=>{})
    describe('OTP', ()=>{})
})