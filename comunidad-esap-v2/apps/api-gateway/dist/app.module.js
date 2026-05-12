"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const documents_controller_1 = require("./documents.controller");
const documents_service_1 = require("./documents.service");
const document_entity_1 = require("./document.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'admin123',
                database: 'melmac_pre',
                entities: [document_entity_1.DocumentEntity],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([document_entity_1.DocumentEntity])
        ],
        controllers: [documents_controller_1.DocumentsController, app_controller_1.AppController],
        providers: [app_service_1.AppService, documents_service_1.DocumentsService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map