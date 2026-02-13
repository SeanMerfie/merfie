CREATE TRIGGER IF NOT EXISTS `content_fts_update` AFTER UPDATE ON content BEGIN
    UPDATE content_fts SET
        title = NEW.title,
        subtitle = COALESCE(NEW.subtitle, ''),
        content = NEW.content,
        hidden_content = COALESCE(NEW.hidden_content, '')
    WHERE rowid = NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `content_fts_delete` AFTER DELETE ON content BEGIN
    DELETE FROM content_fts WHERE rowid = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `content_tags_fts_insert` AFTER INSERT ON content_tags BEGIN
    UPDATE content_fts SET tags = (
        SELECT GROUP_CONCAT(t.tag, ' ')
        FROM content_tags ct
        JOIN tags t ON t.id = ct.tag_id
        WHERE ct.content_id = NEW.content_id
    ) WHERE rowid = NEW.content_id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `content_tags_fts_delete` AFTER DELETE ON content_tags BEGIN
    UPDATE content_fts SET tags = (
        SELECT COALESCE(GROUP_CONCAT(t.tag, ' '), '')
        FROM content_tags ct
        JOIN tags t ON t.id = ct.tag_id
        WHERE ct.content_id = OLD.content_id
    ) WHERE rowid = OLD.content_id;
END;