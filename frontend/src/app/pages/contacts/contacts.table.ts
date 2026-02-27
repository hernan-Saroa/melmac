import { Injectable } from "@angular/core";
import { CustomInputTextFilterComponentUser } from "../user/user.component";
import { CustomInputPhoneComponentUser } from "./contacts.component";

@Injectable({
    providedIn: 'root',
})
export class ContactsTable {
    private activo: string = 'ACTIVO';
    private eliminado: string = 'ELIMINADO';
    public classDel: string = 'icon-deleted-contacts'
    public settings = {
        // mode: 'external',
        noDataMessage: 'Sin contactos',
        pager: {
          display: true,
          perPage: 10,
        },
        actions:{
          columnTitle: "Acciones",
          add: this.onPermit(74),
          edit: this.onPermit(75),
          delete: this.onPermit(76),
        },
        add: {
          addButtonContent: '<i class="nb-person"></i><i class="nb-plus"></i>',
          createButtonContent: '<i class="nb-checkmark"></i>',
          cancelButtonContent: '<i class="nb-close"></i>',
          confirmCreate: true,
        },
        edit: {
          editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
          saveButtonContent: '<i class="nb-checkmark"></i>',
          cancelButtonContent: '<i class="nb-close"></i>',
          confirmSave: true,
        },
        delete: {
          deleteButtonContent: `<i class="nb-trash ${this.classDel}" itemprop="Eliminar"></i>`,
          confirmDelete: true,
        },
        columns: {
          name: {
            title: 'Nombre completo',
            type: 'string',
            filter: {
              type: "custom",
              component: CustomInputTextFilterComponentUser,
            }
          },
          phone: {
            title: 'Teléfono',
            editable: true,
            type: "number",
            editor: {
              type: "custom",
              component: CustomInputPhoneComponentUser,
            },
            filter: {
              type: "custom",
              component: CustomInputTextFilterComponentUser,
            }
          },
          email: {
            title: 'Correo',
            editable: true,
            type: 'email',
            editor: {
              type: 'email'
            },
            filter: {
              type: "custom",
              component: CustomInputTextFilterComponentUser,
            }
          },
          state: {
            title: 'Estado',
            type: 'html',
            editable: false,
            valuePrepareFunction: (value, data, cell) => {
              let info = {badge: 'danger', text: this.eliminado }
              if (data.state){
                info = {badge: 'success', text: this.activo }
              }
              return `<span class="badge badge-${info.badge} ${data.state ? "actived" : "deleted"}">${info.text}</span>`;
            },
            editor: {
              type: 'list',
              config: {
                selectText: 'Selecciona el estado',
                list: [
                  { value: true, title: this.activo },
                  // { value: false, title: this.eliminado },
                ],
              },
            },
            filter: {
              type: 'list',
              config: {
                selectText: 'Buscar por estado',
                list: [
                  { value: true, title: this.activo },
                  { value: false, title: this.eliminado },
                ],
              },
            }
          }
        }
      };

    onPermit(id:number): Boolean {
        const user_data = JSON.parse(localStorage.getItem('session')) || null;
        // console.log('onPermit', user_data)
        if (user_data['permission'].includes(id)) {
          return true;
        }
        return false;
      }
}