import { Compass } from "@styled-icons/boxicons-solid";
import styled, { css } from "styled-components/macro";
import { Header } from "@revoltchat/ui";
import { isTouchscreenDevice } from "../../lib/isTouchscreenDevice";

const Container = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    background: var(--background);

    ${() =>
        isTouchscreenDevice &&
        css`
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            position: fixed;
            padding-bottom: 50px;
        `}
`;

const MessageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    padding: 2rem;
    text-align: center;
    gap: 1.5rem;

    ${() =>
        !isTouchscreenDevice &&
        css`
            background: var(--secondary-background);
            border-start-start-radius: 8px;
            border-end-start-radius: 8px;
        `}
`;

const Text = styled.div`
    font-size: 1.1rem;
    color: var(--foreground);
    line-height: 1.5;
    max-width: 400px;
`;

const IconCircle = styled.div`
    background: var(--primary);
    color: white;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
`;

const ExternalLink = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: white;
    padding: 10px 24px;
    border-radius: 4px;
    font-weight: 600;
    text-decoration: none;
    transition: filter 0.2s;
    font-size: 0.95rem;

    &:hover {
        filter: brightness(1.1);
        text-decoration: none;
        color: white;
    }

    &:active {
        filter: brightness(0.9);
    }
`;

export default function Discover() {
    return (
        <Container>
            {isTouchscreenDevice && (
                <Header palette="primary" withTransparency>
                    <Compass size={27} />
                    Discover
                </Header>
            )}
            <MessageWrapper>
                <IconCircle>
                    <Compass size={32} />
                </IconCircle>
                <Text>
                    Sadly, Discovery is blocked on third party clients. I hope
                    to make my own Discovery system soon, unless we get granted
                    access.
                    <br />
                    <br />
                    Thank you for understanding cutie :D
                </Text>

                <ExternalLink
                    href="https://rvlt.gg"
                    target="_blank"
                    rel="noopener noreferrer">
                    View Discovery @ rvlt.gg
                </ExternalLink>
            </MessageWrapper>
        </Container>
    );
}
