import React, {
  useState,
  useRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
} from 'react';
import { RcTextField } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/InnerTopic/i18n';
import styles from '@ringcentral-integration/widgets/components/InnerTopic/styles.scss';

type TopicProps = {
  name: string;
  currentLocale: string;
  defaultTopic: string;
  updateMeetingTopic: (name: string) => void;
};

export type TopicRef = {
  value: string;
};

const InnerTopic = forwardRef<TopicRef, TopicProps>(
  ({ name, currentLocale, defaultTopic, updateMeetingTopic }, ref) => {
    const [topic, setTopic] = useState(name || defaultTopic);
    const [isTopicChange, setIsTopicChange] = useState(false);
    const inputRef = useRef();

    // DefaultTopic has translation, If user change browser language, defaultTopic need to be switch to corresponding language.
    // If user has input the topic custom. we don't need to update default topic anymore.
    useEffect(() => {
      if (!isTopicChange) {
        setTopic(defaultTopic);
      }
    }, [defaultTopic, isTopicChange]);

    useImperativeHandle(
      ref,
      () => ({
        value: topic,
      }),
      [topic],
    );

    return (
      <RcTextField
        ref={inputRef}
        label={i18n.getString('topic', currentLocale)}
        data-sign="topic"
        fullWidth
        clearBtn={false}
        value={topic}
        inputProps={{
          maxLength: 255,
        }}
        onChange={(e) => {
          setIsTopicChange(true);
          setTopic(e.target.value);
        }}
        onBlur={() => {
          updateMeetingTopic(topic);
        }}
        classes={{
          root: styles.input,
        }}
        gutterBottom
      />
    );
  },
);

export const Topic = React.memo(
  InnerTopic,
  (prevProps, nextProps) =>
    prevProps.name === nextProps.name &&
    prevProps.currentLocale === nextProps.currentLocale,
);
