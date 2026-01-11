import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import styles from "./Skeleton.module.scss";

const SkeletonList = (props: {
    count?: number;
    children: JSX.Element;
    style?: JSX.CSSProperties;
    class?: string;
}) => {
    return (
        <div
            className={`${styles.skeletonList} ${props.class || ""}`}
            style={props.style}>
            {Array(props.count ?? 30)
                .fill(undefined)
                .map((_, i) => (
                    <div key={i}>{props.children}</div>
                ))}
        </div>
    );
};

const SkeletonItem = (props: {
    width?: string;
    height?: string;
    style?: JSX.CSSProperties;
    onInView?: () => void;
    class?: string;
}) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (props.onInView && element.current) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    props.onInView?.();
                }
            });

            observer.observe(element.current);
            return () => observer.disconnect();
        }
    }, [props.onInView]);

    const style = {
        height: props.height,
        width: props.width,
        ...(props.style as any),
    };

    return (
        <div
            ref={element}
            style={style}
            className={`${styles.skeletonItem} ${props.class || ""}`}
        />
    );
};

export const Skeleton = {
    List: SkeletonList,
    Item: SkeletonItem,
};
