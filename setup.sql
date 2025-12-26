-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT,
    anliegen TEXT,
    status TEXT,
    title TEXT,
    prioritaet TEXT,
    nachrichten JSONB,
    neue_nachricht BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (full CRUD access)
CREATE POLICY "Allow public read access" ON public.tickets
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.tickets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.tickets
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.tickets
    FOR DELETE USING (true);

-- TEST DATA - E-Commerce Online Shop Support Tickets
INSERT INTO public.tickets (name, email, title, anliegen, status, prioritaet, nachrichten, neue_nachricht, created_at) VALUES
(
    'Max Mustermann',
    'max.mustermann@example.com',
    'Bestellung nicht angekommen - Versandproblem',
    'Ich habe vor 5 Tagen eine Bestellung aufgegeben (Bestellnummer #12345), aber das Paket ist immer noch nicht angekommen. Die Sendungsverfolgung zeigt an, dass es bereits vor 3 Tagen zugestellt werden sollte. Ich habe bereits beim Versanddienstleister nachgefragt, aber die konnten mir auch nicht weiterhelfen. Können Sie bitte prüfen, was mit meiner Bestellung passiert ist? Ich benötige die Artikel dringend.',
    'NEU',
    'HOCH',
    '[{"message": "Ich habe vor 5 Tagen eine Bestellung aufgegeben (Bestellnummer #12345), aber das Paket ist immer noch nicht angekommen. Die Sendungsverfolgung zeigt an, dass es bereits vor 3 Tagen zugestellt werden sollte.", "sender": "customer", "createdAt": "2024-01-15T10:00:00Z"}]'::jsonb,
    true,
    NOW() - INTERVAL '2 days'
),
(
    'Anna Schmidt',
    'anna.schmidt@example.com',
    'Zahlung wurde doppelt abgebucht',
    'Ich habe gestern eine Bestellung getätigt und festgestellt, dass mein Konto zweimal belastet wurde. Die Zahlung wurde einmal per PayPal und einmal per Kreditkarte abgebucht. Ich habe nur eine Bestellung aufgegeben und sollte nur einmal bezahlen. Können Sie bitte die doppelte Abbuchung rückgängig machen? Die Bestellnummer ist #12346.',
    'IN_BEARBEITUNG',
    'HOCH',
    '[{"message": "Ich habe gestern eine Bestellung getätigt und festgestellt, dass mein Konto zweimal belastet wurde. Die Zahlung wurde einmal per PayPal und einmal per Kreditkarte abgebucht.", "sender": "customer", "createdAt": "2024-01-16T09:00:00Z"}, {"message": "Vielen Dank für Ihre Meldung. Wir prüfen das sofort und erstatten Ihnen die doppelte Zahlung umgehend zurück. Sie erhalten in den nächsten 2-3 Werktagen eine Rückerstattung.", "sender": "support", "createdAt": "2024-01-16T14:30:00Z"}]'::jsonb,
    false,
    NOW() - INTERVAL '1 day'
),
(
    'Peter Müller',
    'peter.mueller@example.com',
    'Falsche Größe erhalten - Retoure gewünscht',
    'Ich habe ein T-Shirt in Größe L bestellt, aber erhalten habe ich Größe M. Das Etikett zeigt zwar L, aber das Shirt ist definitiv zu klein. Ich möchte das Produkt umtauschen oder zurückgeben. Wie funktioniert der Umtauschprozess? Kann ich einfach ein neues in der richtigen Größe bestellen?',
    'IN_BEARBEITUNG',
    'MITTEL',
    '[{"message": "Ich habe ein T-Shirt in Größe L bestellt, aber erhalten habe ich Größe M. Das Etikett zeigt zwar L, aber das Shirt ist definitiv zu klein.", "sender": "customer", "createdAt": "2024-01-17T08:00:00Z"}, {"message": "Das tut uns sehr leid für die Unannehmlichkeiten. Wir senden Ihnen sofort ein Rücksendeetikett zu. Sobald wir die Retoure erhalten haben, senden wir Ihnen das Produkt in der richtigen Größe kostenlos zu.", "sender": "support", "createdAt": "2024-01-17T10:15:00Z"}]'::jsonb,
    false,
    NOW() - INTERVAL '5 hours'
),
(
    'Lisa Weber',
    'lisa.weber@example.com',
    'Produktfrage: Material und Pflegehinweise',
    'Ich interessiere mich für das Produkt "Premium Winterjacke" (Artikelnummer: WINT-2024). Können Sie mir bitte Auskunft geben über das Material, die Waschanleitung und ob die Jacke wasserdicht ist? Außerdem würde ich gerne wissen, ob es diese Jacke auch in anderen Farben gibt als die auf der Website angezeigten.',
    'NEU',
    'NIEDRIG',
    '[{"message": "Ich interessiere mich für das Produkt Premium Winterjacke. Können Sie mir bitte Auskunft geben über das Material, die Waschanleitung und ob die Jacke wasserdicht ist?", "sender": "customer", "createdAt": "2024-01-14T11:00:00Z"}]'::jsonb,
    true,
    NOW() - INTERVAL '3 days'
),
(
    'Thomas Fischer',
    'thomas.fischer@example.com',
    'Gutschein-Code funktioniert nicht',
    'Ich habe einen Gutschein-Code erhalten (WELCOME2024), aber wenn ich ihn beim Checkout eingebe, wird mir angezeigt, dass der Code ungültig oder abgelaufen ist. Der Gutschein sollte aber noch bis Ende des Monats gültig sein. Können Sie bitte prüfen, warum der Code nicht funktioniert?',
    'ABGESCHLOSSEN',
    'MITTEL',
    '[{"message": "Ich habe einen Gutschein-Code erhalten (WELCOME2024), aber wenn ich ihn beim Checkout eingebe, wird mir angezeigt, dass der Code ungültig ist.", "sender": "customer", "createdAt": "2024-01-10T15:00:00Z"}, {"message": "Wir haben das Problem gefunden - der Code benötigt einen Mindestbestellwert von 50€. Bitte versuchen Sie es erneut mit einem Warenkorbwert über 50€.", "sender": "support", "createdAt": "2024-01-11T09:00:00Z"}, {"message": "Ah, verstehe! Vielen Dank für die schnelle Antwort, jetzt funktioniert es.", "sender": "customer", "createdAt": "2024-01-11T16:00:00Z"}]'::jsonb,
    false,
    NOW() - INTERVAL '7 days'
),
(
    'Sarah Becker',
    'sarah.becker@example.com',
    'Warenkorb wird nicht gespeichert',
    'Immer wenn ich Produkte in den Warenkorb lege und dann die Seite verlasse, sind die Artikel beim nächsten Besuch wieder weg. Das ist sehr frustrierend, besonders wenn ich mehrere Artikel vergleichen möchte. Gibt es eine Möglichkeit, den Warenkorb zu speichern oder muss ich alles auf einmal bestellen?',
    'ABGESCHLOSSEN',
    'NIEDRIG',
    '[{"message": "Immer wenn ich Produkte in den Warenkorb lege und dann die Seite verlasse, sind die Artikel beim nächsten Besuch wieder weg.", "sender": "customer", "createdAt": "2024-01-05T12:00:00Z"}, {"message": "Wenn Sie sich mit einem Konto anmelden, wird Ihr Warenkorb automatisch gespeichert. Alternativ können Sie die Artikel auch als Favoriten speichern. Wir arbeiten auch an einer Verbesserung der Warenkorb-Funktion für Gäste.", "sender": "support", "createdAt": "2024-01-05T14:00:00Z"}]'::jsonb,
    false,
    NOW() - INTERVAL '10 days'
),
(
    'Michael Wagner',
    'michael.wagner@example.com',
    'Kritisch: Bestellung storniert ohne Grund',
    'Ich habe gestern eine dringende Bestellung aufgegeben (Bestellnummer #12347) für ein Geschenk, das ich am Wochenende brauche. Heute wurde die Bestellung ohne Angabe von Gründen storniert. Das ist sehr problematisch, da ich das Geschenk dringend benötige. Können Sie bitte sofort prüfen, warum die Bestellung storniert wurde und ob sie wiederhergestellt werden kann?',
    'IN_BEARBEITUNG',
    'HOCH',
    '[{"message": "Ich habe gestern eine dringende Bestellung aufgegeben (Bestellnummer #12347) für ein Geschenk, das ich am Wochenende brauche. Heute wurde die Bestellung ohne Angabe von Gründen storniert.", "sender": "customer", "createdAt": "2024-01-17T13:00:00Z"}, {"message": "Wir entschuldigen uns für die Unannehmlichkeiten. Wir prüfen das sofort und setzen uns umgehend mit Ihnen in Verbindung. Falls möglich, werden wir die Bestellung wiederherstellen und mit Express-Versand zustellen.", "sender": "support", "createdAt": "2024-01-17T13:30:00Z"}]'::jsonb,
    true,
    NOW() - INTERVAL '1 hour'
),
(
    'Julia Klein',
    'julia.klein@example.com',
    'Account kann nicht erstellt werden',
    'Ich versuche seit gestern, ein neues Kundenkonto zu erstellen, aber ich erhalte immer eine Fehlermeldung. Die Registrierung wird nicht abgeschlossen, obwohl alle Felder ausgefüllt sind. Ich habe bereits versucht, verschiedene E-Mail-Adressen zu verwenden und den Browser-Cache zu leeren, aber nichts hilft. Können Sie mir bitte helfen?',
    'NEU',
    'MITTEL',
    '[{"message": "Ich versuche seit gestern, ein neues Kundenkonto zu erstellen, aber ich erhalte immer eine Fehlermeldung. Die Registrierung wird nicht abgeschlossen, obwohl alle Felder ausgefüllt sind.", "sender": "customer", "createdAt": "2024-01-17T11:30:00Z"}]'::jsonb,
    true,
    NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;
