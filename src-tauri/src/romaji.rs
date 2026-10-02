use sabiyomi::{LongVowels, Mode, Options, RomajiSystem, Sabiyomi, Target};
use std::sync::OnceLock;

static SABIYOMI: OnceLock<Sabiyomi> = OnceLock::new();

fn get_sabiyomi() -> &'static Sabiyomi {
    SABIYOMI.get_or_init(|| Sabiyomi::new().expect("Failed to initialize Sabiyomi morphological analyzer"))
}

/// Checks if a string contains any Japanese characters (Hiragana, Katakana, or Kanji).
pub fn has_japanese_text(text: &str) -> bool {
    text.chars().any(|c| {
        matches!(c,
            '\u{3040}'..='\u{309F}' | // Hiragana
            '\u{30A0}'..='\u{30FF}' | // Katakana
            '\u{3400}'..='\u{4DBF}' | // CJK Extension A
            '\u{4E00}'..='\u{9FFF}'   // CJK Unified Ideographs (Kanji)
        )
    })
}

/// Converts a single line of Japanese text to spaced Hepburn Romaji.
/// Returns None if the line does not contain any Japanese characters.
pub fn transliterate_line(text: &str) -> Option<String> {
    let trimmed = text.trim();
    if trimmed.is_empty() || !has_japanese_text(trimmed) {
        return None;
    }

    let s = get_sabiyomi();
    let mut opts = Options::default();
    opts.to = Target::Romaji;
    opts.mode = Mode::Spaced;
    opts.system = RomajiSystem::Hepburn;
    opts.long_vowels = Some(LongVowels::Spelled);

    match s.convert(trimmed, &opts) {
        Ok(converted) => {
            let res = converted.trim().to_string();
            if res.is_empty() {
                None
            } else {
                Some(res)
            }
        }
        Err(e) => {
            eprintln!("[Romaji] Transliteration failed for '{}': {:?}", text, e);
            None
        }
    }
}

/// Batch transliterates multiple lines of text.
pub fn transliterate_lines(lines: &[String]) -> Vec<Option<String>> {
    lines.iter().map(|line| transliterate_line(line)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_has_japanese_text() {
        assert!(has_japanese_text("こんにちは"));
        assert!(has_japanese_text("カタカナ"));
        assert!(has_japanese_text("東京"));
        assert!(has_japanese_text("Hello 世界"));
        assert!(!has_japanese_text("Hello World"));
        assert!(!has_japanese_text("12345 !@#$"));
    }

    #[test]
    fn test_transliterate_line_japanese() {
        let res = transliterate_line("君のことを想う 夜が明けるまで");
        assert!(res.is_some());
        let romaji = res.unwrap();
        assert_eq!(romaji, "kimi no koto o omou yoru ga akeru made");
    }

    #[test]
    fn test_transliterate_line_anime_theme() {
        let res = transliterate_line("残酷な天使のテーゼ");
        assert!(res.is_some());
        let romaji = res.unwrap();
        assert_eq!(romaji, "zankoku na tenshi no teeze");
    }

    #[test]
    fn test_transliterate_line_english_returns_none() {
        assert_eq!(transliterate_line("Never gonna give you up"), None);
        assert_eq!(transliterate_line(""), None);
    }
}
