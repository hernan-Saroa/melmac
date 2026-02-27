import { EnumShareDocumentType } from "../enums/input-share-document.enum";

export interface IContextDialog {
    type: EnumShareDocumentType
    icon: string ,
    title: string,
    listName: string,
    descriptionButton: string,
    data: IResponseDialogData[],
}

export interface IResponseDialog {
    status: boolean;
    data: IResponseDialogData[]
}

export interface IResponseDialogData {
    index: number;
    value: string;
}