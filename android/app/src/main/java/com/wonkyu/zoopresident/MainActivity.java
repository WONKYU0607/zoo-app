package com.wonkyu.zoopresident;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * 안드로이드 웹뷰는 기본으로 **8px 보다 작은 글씨를 안 그린다.**
 * (WebSettings 의 minimumFontSize · minimumLogicalFontSize 기본값이 둘 다 8)
 *
 * 그래서 CSS 에 4.86px 라고 적어도 폰에서는 8px 로 그려졌다.
 * 손패 카드 이름이 자리보다 넓어져 **카드 밖으로 흘러나갔다** —
 * 2026-09-28 신고("카멜레온 글씨가 오른쪽으로 치우쳐 있다")가 이것이었다.
 * 실측: CHAMELEON 54.8px · CROCODILE 49.6px · ELEPHANT 46px 인데 자리는 37.6px.
 * 가운데 정렬이 깨진 게 아니라, 띠가 space-between 이라 왼쪽에 붙고 오른쪽으로 넘친 것이다.
 *
 * 바닥을 1px 로 내리면 **CSS 에 적은 크기가 폰에서 그대로 나온다.**
 * 카드 이름뿐 아니라 규칙 화면·진입 화면의 작은 글씨도 전부 적은 대로 그려진다.
 * (앞으로 작은 글씨를 잡을 때 이 함정을 다시 밟지 않으려고 여기 적어 둔다.
 *  데스크톱 크로미움은 이 바닥이 0이라 그냥 띄우면 절대 재현이 안 된다 —
 *  재현하려면 `--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8` 로 띄운다)
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        /* 웹뷰를 못 만든 경우(구형 기기에서 웹뷰가 없거나 업데이트 중)에는
           BridgeActivity 가 bridge 를 안 만들고 빠져나간다. 그때 그냥 부르면 앱이 죽는다 */
        Bridge b = getBridge();
        if (b == null) return;
        WebView w = b.getWebView();
        if (w == null) return;

        WebSettings s = w.getSettings();
        s.setMinimumFontSize(1);
        s.setMinimumLogicalFontSize(1);
    }
}
