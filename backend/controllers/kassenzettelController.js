import Anthropic from '@anthropic-ai/sdk';

export const scanKassenzettel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Kein Bild hochgeladen' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Erkenne alle Artikel auf diesem Kassenzettel. Gib mir eine JSON-Liste mit Objekten, die "name" (String, bereinigter Artikelname auf Deutsch) und "stueckzahl" (Number, Ganzzahl) enthalten. Wenn ein Artikel mehrfach vorkommt, summiere die Stückzahlen. Antworte NUR mit dem JSON-Array, ohne Erklärungen oder Markdown-Formatierung.',
            },
          ],
        },
      ],
    });

    const text = response.content[0].text.trim();
    // Strip potential markdown code fences
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const artikel = JSON.parse(cleaned);

    res.json({ artikel });
  } catch (error) {
    console.error('Error scanning Kassenzettel:', error);
    res.status(500).json({ message: 'Fehler beim Einlesen des Kassenzettels: ' + error.message });
  }
};
