import fs from 'fs';
import path from 'path';

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.paymentLogFile = path.join(this.logDir, 'payment.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Error creating log directory:', error);
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
        return `[${timestamp}] ${level}: ${message}${dataString}\n${'='.repeat(80)}\n`;
    }

    async log(level, message, data = null) {
        const formattedMessage = this.formatMessage(level, message, data);
        
        // Siempre mostramos en consola
        console.log(formattedMessage);

        try {
            await fs.promises.appendFile(this.paymentLogFile, formattedMessage);
        } catch (error) {
            console.error('Error writing to log file:', error);
            // No propagamos el error para no interrumpir la ejecución
        }
    }

    // Métodos síncronos para evitar problemas con await
    info(message, data = null) {
        this.log('INFO', message, data).catch(console.error);
    }

    error(message, data = null) {
        this.log('ERROR', message, data).catch(console.error);
    }

    warning(message, data = null) {
        this.log('WARNING', message, data).catch(console.error);
    }

    // Alias para compatibilidad
    warn(message, data = null) {
        this.warning(message, data);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message, data).catch(console.error);
        }
    }
}

// Exportamos una única instancia
export const logger = new Logger(); 