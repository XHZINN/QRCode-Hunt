export interface UserProfile {
  id_user: string;
  nome: string;
  data_nasc: string;
  email: string;
  telefone: string;
  status_academico: string;
  escola?: string;
  curso_interesse: string;
  pontos: number;
  data_registro: Date;
}