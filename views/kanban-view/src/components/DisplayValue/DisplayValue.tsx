import { useEffect, useRef, useState } from "preact/hooks";
import { Literal } from "@coasys/ad4m";
import styles from "./DisplayValue.module.css";
import type { Profile } from "@coasys/flux-types";
import { getProfile } from "@coasys/flux-api";

export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

type Props = {
  value: any;
  options?: any;
  onUrlClick?: Function;
  onUpdate?: (value: string) => void;
};

export default function DisplayValue({
  value,
  options,
  onUpdate,
  onUrlClick = () => {},
}: Props) {
  const inputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  }

  function onBlur(e) {
    onUpdate(e.target.value);
    setIsEditing(false);
  }

  function onStartEdit(e) {
    e.stopPropagation();
    setIsEditing(true);
  }

  const isCollection = Array.isArray(value);

  if (isCollection) {
    return (
      <j-flex gap="200" wrap>
        {value.map((v, index) => {
          return <DisplayValue onUrlClick={onUrlClick} value={v} />;
        })}
      </j-flex>
    );
  }

  if (options) {
    return (
      <div className={styles.selectWrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
        >
          {options.map((option) => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
        <j-icon name="chevron-down" size="xs"></j-icon>
      </div>
    );
  }

  if (isEditing && onUpdate) {
    return (
      <input
        ref={inputRef}
        size="sm"
        className={styles.input}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        value={value}
      ></input>
    );
  }

  if (typeof value === "string") {
    if (value.startsWith("did:key")) {
      return <Profile did={value}></Profile>;
    }

    if (value.length > 1000)
      return (
        <img className={styles.img} src={`data:image/png;base64,${value}`} />
      );
    if (isValidUrl(value)) {
      if (value.startsWith("literal://")) {
        return (
          <a
            className={styles.entryUrl}
            href={value}
            onClick={(e) => {
              e.stopPropagation();
              onUrlClick(value);
            }}
          >
            {Literal.fromUrl(value).get()}
          </a>
        );
      }

      return (
        <a
          className={styles.entryUrl}
          href={value}
          onClick={(e) => {
            e.stopPropagation();
            onUrlClick(value);
          }}
        >
          {value}
        </a>
      );
    }

    return (
      <j-flex gap="500" a="center">
        <div className={styles.value} onClick={onStartEdit}>
          {value}
        </div>
      </j-flex>
    );
  }

  if (value?.constructor?.name === "Object") {
    return <ShowObjectInfo value={value} />;
  }

  if (value === true) return <j-toggle size="sm" checked></j-toggle>;

  if (value === false)
    return onUpdate ? (
      <j-button onClick={onStartEdit} square circle size="sm" variant="ghost">
        <j-icon size="xs" name="pencil"></j-icon>
      </j-button>
    ) : (
      <span></span>
    );

  return value === null ? <span></span> : value;
}

function ShowObjectInfo({ value }) {
  const [open, setOpen] = useState(false);

  const properties = Object.entries(value);

  function onClick(e) {
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <div>
      <j-button variant="subtle" size="xs" onClick={onClick}>
        Show
      </j-button>
      {open && (
        <j-modal
          open={open}
          onClick={(e) => e.stopImmediatePropagation()}
          onToggle={(e) => setOpen(e.target.open)}
        >
          <j-box p="500">
            <j-flex p="500" direction="column" gap="400">
              {properties.map(([key, value]) => (
                <j-flex gap="100" direction="column">
                  <j-text size="300" uppercase nomargin>
                    {key}
                  </j-text>
                  <DisplayValue value={value} />
                </j-flex>
              ))}
            </j-flex>
          </j-box>
        </j-modal>
      )}
    </div>
  );
}

function Profile({ did }: { did: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfile(did).then(setProfile);
  }, [did]);

  return (
    <j-tooltip strategy="fixed" title={profile?.username}>
      <j-avatar
        size="xs"
        hash={did}
        src={profile?.profileThumbnailPicture}
      ></j-avatar>
    </j-tooltip>
  );
}
