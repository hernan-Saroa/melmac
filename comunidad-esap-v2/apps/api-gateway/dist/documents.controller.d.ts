import { DocumentsService } from './documents.service';
import { DocumentEntity } from './document.entity';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    getDocuments(): Promise<DocumentEntity[]>;
    createDocument(data: Partial<DocumentEntity>): Promise<DocumentEntity>;
    removeDocument(id: string): Promise<void>;
}
