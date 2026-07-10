CREATE OR REPLACE FUNCTION __blog_text_to_tiptap_json(input_text text)
RETURNS jsonb AS $$
DECLARE
  plain_text text;
BEGIN
  IF input_text IS NULL OR btrim(input_text) = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN input_text::jsonb;
  EXCEPTION WHEN others THEN
    plain_text := btrim(
      regexp_replace(
        replace(replace(input_text, '&nbsp;', ' '), '&amp;', '&'),
        '<[^>]+>',
        ' ',
        'g'
      )
    );

    IF plain_text = '' THEN
      RETURN jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph')));
    END IF;

    RETURN jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', plain_text)
          )
        )
      )
    );
  END;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "blog_post"
ALTER COLUMN "content" TYPE JSONB
USING __blog_text_to_tiptap_json("content");

DROP FUNCTION __blog_text_to_tiptap_json(text);
