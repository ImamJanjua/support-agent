import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

interface TicketResponseEmailProps {
    ticketId?: string;
    personName?: string;
    response?: string;
    ticketTitle?: string;
    ticketStatus?: string;
    ticketUrl?: string;
}

export const TicketResponseEmail = ({
    ticketId,
    personName,
    response,
    ticketTitle,
    ticketStatus,
    ticketUrl,
}: TicketResponseEmailProps) => {
    const previewText = `Neue Antwort auf Ihr Support-Ticket #${ticketId}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="mx-auto my-auto bg-gray-50 px-2 font-sans">
                    <Container className="mx-auto my-[40px] max-w-[600px] rounded-lg border border-gray-300 bg-white p-[40px]">
                        {/* Header */}
                        <Section className="mb-[32px]">
                            <Heading className="mx-0 my-0 p-0 text-left text-[24px] font-semibold text-gray-900">
                                Antwort auf Ihr Support-Ticket
                            </Heading>
                        </Section>

                        {/* Greeting */}
                        <Text className="text-[16px] leading-[24px] text-gray-700">
                            Hallo {personName || 'Kunde'},
                        </Text>

                        <Text className="text-[16px] leading-[24px] text-gray-700">
                            vielen Dank für Ihre Anfrage. Wir haben eine Antwort auf Ihr Support-Ticket:
                        </Text>

                        {/* Ticket Info Box */}
                        <Section className="my-[24px] rounded-lg border border-gray-200 bg-gray-50 p-[20px]">
                            <Text className="m-0 text-[14px] font-semibold text-gray-900">
                                Ticket-ID: <span className="font-mono text-[13px]">{ticketId || 'N/A'}</span>
                            </Text>
                            {ticketTitle && (
                                <Text className="m-0 mt-[8px] text-[14px] text-gray-700">
                                    <strong>Betreff:</strong> {ticketTitle}
                                </Text>
                            )}
                            {ticketStatus && (
                                <Text className="m-0 mt-[8px] text-[14px] text-gray-700">
                                    <strong>Status:</strong> {ticketStatus}
                                </Text>
                            )}
                        </Section>

                        {/* Response Content */}
                        <Section className="my-[24px]">
                            <Text className="m-0 mb-[12px] text-[14px] font-semibold text-gray-900">
                                Unsere Antwort:
                            </Text>
                            <Section className="rounded-lg border border-gray-200 bg-white p-[20px]">
                                <Text className="m-0 whitespace-pre-wrap text-[15px] leading-[24px] text-gray-800">
                                    {response || 'Keine Antwort verfügbar.'}
                                </Text>
                            </Section>
                        </Section>

                        {/* Call to Action */}
                        {ticketUrl && (
                            <Section className="my-[32px] text-center">
                                <Button
                                    className="rounded-lg bg-gray-900 px-6 py-3 text-center text-[14px] font-semibold text-white no-underline"
                                    href={ticketUrl}
                                >
                                    Ticket ansehen und antworten
                                </Button>
                            </Section>
                        )}

                        <Hr className="mx-0 my-[32px] w-full border border-gray-200" />

                        {/* Footer */}
                        <Section>
                            <Text className="m-0 text-[14px] leading-[20px] text-gray-600">
                                Falls Sie weitere Fragen haben, können Sie direkt mit den Button oben antworten.
                            </Text>
                        </Section>

                        {/* Support Footer */}
                        <Section className="mt-[32px] border-t border-gray-200 pt-[24px]">
                            <Text className="m-0 text-[12px] leading-[18px] text-gray-500">
                                Mit freundlichen Grüßen,<br />
                                Ihr Support-Team
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

TicketResponseEmail.PreviewProps = {
    ticketId: 'TKT-2024-001234',
    personName: 'Max Mustermann',
    ticketTitle: 'Login Problem Passwort',
    ticketStatus: 'In Bearbeitung',
    response: `Vielen Dank für Ihre Anfrage bezüglich des Login-Problems.

Wir haben Ihr Problem überprüft und können Ihnen folgende Lösung anbieten:

1. Bitte versuchen Sie, Ihr Passwort über die "Passwort vergessen" Funktion zurückzusetzen.
2. Stellen Sie sicher, dass Sie die richtige E-Mail-Adresse verwenden.
3. Falls das Problem weiterhin besteht, können Sie uns gerne kontaktieren.

Wir hoffen, dass dies hilfreich war. Falls Sie weitere Fragen haben, zögern Sie nicht, uns zu kontaktieren.`,
    // ticketUrl: 'https://example.com/tickets/TKT-2024-001234',
} as TicketResponseEmailProps;

export default TicketResponseEmail;

