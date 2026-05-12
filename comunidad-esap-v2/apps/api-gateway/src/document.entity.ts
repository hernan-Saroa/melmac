import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('melmac_v2_documents') // Prefijo para no colisionar con Django
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 100 })
  status: string;

  @Column({ length: 255 })
  author: string;

  @CreateDateColumn()
  date: Date;
}
