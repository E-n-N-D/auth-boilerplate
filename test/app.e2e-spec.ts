import { after, before, beforeEach, describe, it } from "node:test";
import {Test} from '@nestjs/testing'
import { AppModule } from "@/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";

describe('App e2e', ()=>{

    let app: INestApplication;

    before(async ()=>{
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
    });

    after(()=>{
        app.close()
    })

    it.todo('should pass')
})