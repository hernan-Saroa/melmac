export class SessionUtil {
  static getSession(): any {
    try {
      const data = localStorage.getItem('session');
      if (!data) return null;
      // Primero intentamos parsear como JSON directo (formato de Angular)
      try {
        return JSON.parse(data);
      } catch (err) {
        // Si falla, intentamos decodificar de base64 (formato de React actual)
        return JSON.parse(atob(data));
      }
    } catch (e) {
      console.error('Error al decodificar la sesión', e);
      return null;
    }
  }

  static setSession(data: any): void {
    try {
      const encoded = btoa(JSON.stringify(data));
      localStorage.setItem('session', encoded);
    } catch (e) {
      console.error('Error al codificar la sesión', e);
    }
  }

  static removeSession(): void {
    localStorage.removeItem('session');
  }

  static getToken(): string | null {
    const session = this.getSession();
    return session ? session.token : null;
  }

  static getEnterpriseId(): number | null {
    const session = this.getSession();
    return session ? session.enterprise : null;
  }
}
