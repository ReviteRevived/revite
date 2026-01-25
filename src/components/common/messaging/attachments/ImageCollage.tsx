import { API } from "revolt.js";
import classNames from "classnames";
import Attachment from "./Attachment";
import styles from "./ImageCollage.module.scss";

interface Props {
    attachments: API.File[];
    hasContent?: boolean;
}

export default function ImageCollage({ attachments, hasContent }: Props) {
    const count = attachments.length;
    const shownAttachments = attachments.slice(0, 5);
    const extraCount = count - 5;
    const firstMeta = attachments[0]?.metadata;
    const anchorRatio =
        firstMeta?.type === "Image" || firstMeta?.type === "Video"
            ? firstMeta.width / firstMeta.height
            : 1;

    return (
        <div
            className={classNames(styles.container, {
                [styles.hasContent]: hasContent,
                [styles[`count${Math.min(count, 5)}`]]: true,
            })}
            style={
                {
                    "--img-ratio": Math.min(Math.max(anchorRatio, 0.7), 2.5),
                } as any
            }>
            {shownAttachments.map((attachment, index) => (
                <div key={attachment._id} className={styles.item}>
                    <Attachment attachment={attachment} hasContent={false} />

                    {index === 4 && extraCount > 0 && (
                        <div className={styles.moreOverlay}>
                            <span>+{extraCount}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
