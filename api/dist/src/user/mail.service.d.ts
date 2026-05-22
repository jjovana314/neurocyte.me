export declare class MailService {
    private transporter;
    constructor();
    sendDeactivationEmail(adminEmail: string, deactivationLink: string, userName: string): Promise<void>;
}
