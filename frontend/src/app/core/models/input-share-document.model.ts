import { EnumShareDocumentType, EnumShareDocumentActions } from '../enums/input-share-document.enum';
import { IResponseDialogData } from './dialog.model';

export interface IShareDocument {
    type: EnumShareDocumentType.PHONE | EnumShareDocumentType.EMAIL | EnumShareDocumentType.CONTACT;
    label: string;
    actions: EnumShareDocumentActions[]
    checkBoxs: ICkeckBox[];
}

export interface IPhoneNumber {
    phoneInd: string,
    phoneNumber: string,
    iso2: string
}

export interface IReturnData {
    phone: IReturnDataDetail;
    email: IReturnDataDetail;
    contact: IReturnDataDetail;
}

export interface IReturnDataDetail {
    listaContactos: IResponseDialogData[];
    checkBoxs: ICkeckBox[];
    attachments: IResponseDialogData[];
}

export interface ICkeckBox {
    key: string;
    value: boolean;
}

export interface IEditSelected {
    index: number;
    type: string;
}