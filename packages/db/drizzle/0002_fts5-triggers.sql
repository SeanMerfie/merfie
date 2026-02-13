CREATE TRIGGER IF NOT EXISTS `content_fts_insert` AFTER INSERT ON content BEGIN
    INSERT INTO content_fts(rowid, title, subtitle, content, hidden_content, tags)
    VALUES (
        NEW.id,
        NEW.title,
        COALESCE(NEW.subtitle, ''),
        NEW.content,
        COALESCE(NEW.hidden_content, ''),
        ''
    );
END;