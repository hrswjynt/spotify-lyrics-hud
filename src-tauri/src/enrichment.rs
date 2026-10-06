use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;

static CACHE: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&quot;", "\"")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}

pub fn parse_artists_from_html(html: &str) -> Option<String> {
    // 1. Try <meta name="music:musician_description" content="..." />
    let music_tag = "music:musician_description";
    if let Some(pos) = html.find(music_tag) {
        let snippet = &html[pos..std::cmp::min(html.len(), pos + 400)];
        if let Some(c_pos) = snippet.find("content=\"") {
            let start = c_pos + 9;
            if let Some(end) = snippet[start..].find('"') {
                let candidate = decode_html_entities(snippet[start..start + end].trim());
                if !candidate.is_empty() {
                    return Some(candidate);
                }
            }
        }
    }

    // 2. Try <meta property="og:description" content="Artist 1, Artist 2 · Title · Song · Year" />
    let og_tag = "property=\"og:description\"";
    if let Some(pos) = html.find(og_tag) {
        let snippet = &html[pos..std::cmp::min(html.len(), pos + 400)];
        if let Some(c_pos) = snippet.find("content=\"") {
            let start = c_pos + 9;
            if let Some(end) = snippet[start..].find('"') {
                let desc = &snippet[start..start + end];
                if let Some(first_dot) = desc.find(" · ") {
                    let candidate = decode_html_entities(desc[..first_dot].trim());
                    if !candidate.is_empty() {
                        return Some(candidate);
                    }
                }
            }
        }
    }

    // 3. Try <title>Title - song and lyrics by Artist 1, Artist 2 | Spotify</title>
    let title_prefix = " - song and lyrics by ";
    let title_suffix = " | Spotify";
    if let Some(p_pos) = html.find(title_prefix) {
        let start = p_pos + title_prefix.len();
        if let Some(s_pos) = html[start..].find(title_suffix) {
            let candidate = decode_html_entities(html[start..start + s_pos].trim());
            if !candidate.is_empty() {
                return Some(candidate);
            }
        }
    }

    None
}

pub fn sanitize_track_id(raw_id: &str) -> String {
    let mut id = raw_id.trim();
    if let Some(idx) = id.rfind("/track/") {
        id = &id[idx + 7..];
    } else if let Some(idx) = id.rfind("track:") {
        id = &id[idx + 6..];
    }
    // Remove query parameters or fragments if present
    if let Some(q_idx) = id.find('?') {
        id = &id[..q_idx];
    }
    if let Some(h_idx) = id.find('#') {
        id = &id[..h_idx];
    }
    id.to_string()
}

pub fn fetch_and_enrich(raw_id: &str) -> Option<String> {
    let clean_id = sanitize_track_id(raw_id);
    if clean_id.is_empty() {
        return None;
    }

    // Check cache
    {
        let mut cache_guard = CACHE.lock().unwrap();
        let cache = cache_guard.get_or_insert_with(HashMap::new);
        if let Some(cached) = cache.get(&clean_id) {
            return Some(cached.clone());
        }
    }

    // Fetch from Spotify public track page
    let url = format!("https://open.spotify.com/track/{}", clean_id);
    let output = Command::new("curl")
        .args([
            "-s",
            "--max-time",
            "3",
            "-L",
            "-A",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            &url,
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let html = String::from_utf8_lossy(&output.stdout);
    if let Some(artists) = parse_artists_from_html(&html) {
        let mut cache_guard = CACHE.lock().unwrap();
        let cache = cache_guard.get_or_insert_with(HashMap::new);
        cache.insert(clean_id, artists.clone());
        Some(artists)
    } else {
        None
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    #[test]
    fn test_sanitize_track_id() {
        assert_eq!(sanitize_track_id("/com/spotify/track/3f1ChZHm6v4KdUaEW5y5qd"), "3f1ChZHm6v4KdUaEW5y5qd");
        assert_eq!(sanitize_track_id("spotify:track:3f1ChZHm6v4KdUaEW5y5qd"), "3f1ChZHm6v4KdUaEW5y5qd");
        assert_eq!(sanitize_track_id("https://open.spotify.com/track/3f1ChZHm6v4KdUaEW5y5qd?si=abc"), "3f1ChZHm6v4KdUaEW5y5qd");
        assert_eq!(sanitize_track_id("3f1ChZHm6v4KdUaEW5y5qd"), "3f1ChZHm6v4KdUaEW5y5qd");
    }

    #[test]
    fn test_parse_music_musician_description() {
        let html = r#"
            <html>
                <head>
                    <meta name="music:musician_description" content="Cold Hart, Lil Peep"/>
                </head>
            </html>
        "#;
        assert_eq!(parse_artists_from_html(html), Some("Cold Hart, Lil Peep".to_string()));
    }

    #[test]
    fn test_parse_og_description() {
        let html = r#"
            <html>
                <head>
                    <meta property="og:description" content="Cold Hart, Lil Peep · Me and You · Song · 2020"/>
                </head>
            </html>
        "#;
        assert_eq!(parse_artists_from_html(html), Some("Cold Hart, Lil Peep".to_string()));
    }

    #[test]
    fn test_parse_title_fallback() {
        let html = r#"
            <html>
                <head>
                    <title>Me and You - song and lyrics by Cold Hart, Lil Peep | Spotify</title>
                </head>
            </html>
        "#;
        assert_eq!(parse_artists_from_html(html), Some("Cold Hart, Lil Peep".to_string()));
    }

    #[test]
    fn test_decode_html_entities() {
        let html = r#"
            <meta name="music:musician_description" content="Queen &amp; David Bowie&#x27;s Band"/>
        "#;
        assert_eq!(parse_artists_from_html(html), Some("Queen & David Bowie's Band".to_string()));
    }

    #[test]
    fn test_parse_empty_or_invalid() {
        let html = "<html><head><title>Nothing here</title></head></html>";
        assert_eq!(parse_artists_from_html(html), None);
    }
}
